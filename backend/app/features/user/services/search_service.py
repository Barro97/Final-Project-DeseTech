"""
User Search Service - Business Logic for User Search Operations

This service provides user search functionality following the same patterns
as the dataset search service. It handles user search with privacy filtering,
pagination, and various search criteria.
"""
from typing import List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import or_, desc, asc, func
from backend.app.database.models import User, Role, Dataset
from backend.app.features.user.user_schemas.search import (
    UserSearchRequest, UserSearchResponse, UserSearchListResponse
)


class UserSearchService:
    """Service for handling user search operations with privacy filtering."""
    
    def search_users(self, db: Session, request: UserSearchRequest) -> UserSearchListResponse:
        """
        Search users with filters and pagination.
        
        Args:
            db: Database session
            request: Search request with filters and pagination
            
        Returns:
            UserSearchListResponse: Paginated search results
        """
        # Build base query with role join
        query = db.query(User).join(User.role, isouter=True)
        
        # Apply privacy filter - only show active users for public search
        query = query.filter(User.status == 'active')
        
        # Apply text search filter
        if request.search_term:
            # Normalize search term (remove extra spaces)
            search_term = ' '.join(request.search_term.strip().split())
            search = f"%{search_term}%"
            
            query = query.filter(
                or_(
                    User.username.ilike(search),
                    User.first_name.ilike(search),
                    User.last_name.ilike(search),
                    User.email.ilike(search),
                    User.organization.ilike(search),
                    # Search concatenated full names to handle "John Smith" searches
                    func.concat(
                        func.coalesce(User.first_name, ''), 
                        ' ', 
                        func.coalesce(User.last_name, '')
                    ).ilike(search),
                    # Also search reverse order for "Smith John" searches
                    func.concat(
                        func.coalesce(User.last_name, ''), 
                        ' ', 
                        func.coalesce(User.first_name, '')
                    ).ilike(search)
                )
            )
        
        # Apply role filter
        if request.roles:
            query = query.filter(Role.role_name.in_(request.roles))
        
        # Apply organization filter
        if request.organizations:
            query = query.filter(User.organization.in_(request.organizations))
        
        # Apply status filter (though we already filter to active above)
        if request.status:
            query = query.filter(User.status.in_(request.status))
        
        # Apply dataset count filters
        if request.has_datasets is not None or request.min_datasets is not None:
            # Subquery to count datasets per user
            dataset_count_subquery = db.query(
                Dataset.uploader_id,
                func.count(Dataset.dataset_id).label('dataset_count')
            ).group_by(Dataset.uploader_id).subquery()
            
            query = query.outerjoin(
                dataset_count_subquery,
                User.user_id == dataset_count_subquery.c.uploader_id
            )
            
            if request.has_datasets:
                query = query.filter(dataset_count_subquery.c.dataset_count > 0)
            elif request.has_datasets is False:
                query = query.filter(
                    or_(
                        dataset_count_subquery.c.dataset_count == 0,
                        dataset_count_subquery.c.dataset_count.is_(None)
                    )
                )
            
            if request.min_datasets is not None:
                query = query.filter(
                    func.coalesce(dataset_count_subquery.c.dataset_count, 0) >= request.min_datasets
                )
        
        # Get total count before pagination
        total_count = query.count()
        
        # Apply sorting
        if request.sort_by == "name":
            query = query.order_by(asc(User.first_name), asc(User.last_name))
        elif request.sort_by == "recent":
            query = query.order_by(desc(User.last_login))
        elif request.sort_by == "datasets":
            # For dataset sorting, we need the dataset count in the main query
            if 'dataset_count_subquery' not in locals():
                dataset_count_subquery = db.query(
                    Dataset.uploader_id,
                    func.count(Dataset.dataset_id).label('dataset_count')
                ).group_by(Dataset.uploader_id).subquery()
                
                query = query.outerjoin(
                    dataset_count_subquery,
                    User.user_id == dataset_count_subquery.c.uploader_id
                )
            
            query = query.order_by(desc(func.coalesce(dataset_count_subquery.c.dataset_count, 0)))
        elif request.sort_by == "activity":
            query = query.order_by(desc(User.last_login))
        else:  # relevance (default)
            query = query.order_by(asc(User.username))
        
        # Apply pagination
        offset = (request.page - 1) * request.limit
        users = query.offset(offset).limit(request.limit).all()
        
        # Convert to response format
        user_responses = []
        for user in users:
            # Get dataset count for this user
            dataset_count = db.query(Dataset).filter(Dataset.uploader_id == user.user_id).count()
            
            # Build full name
            full_name = ""
            if user.first_name and user.last_name:
                full_name = f"{user.first_name} {user.last_name}"
            elif user.first_name:
                full_name = user.first_name
            elif user.last_name:
                full_name = user.last_name
            else:
                full_name = user.username
            
            # Calculate profile completeness (basic implementation)
            completeness_score = 0
            if user.first_name: completeness_score += 1
            if user.last_name: completeness_score += 1
            if user.organization: completeness_score += 1
            if user.country: completeness_score += 1
            if user.education: completeness_score += 1
            
            if completeness_score >= 4:
                profile_completeness = "complete"
            elif completeness_score >= 2:
                profile_completeness = "intermediate"
            else:
                profile_completeness = "basic"
            
            user_response = UserSearchResponse(
                user_id=user.user_id,
                username=user.username,
                full_name=full_name,
                email=user.email,  # Note: In production, this should respect privacy settings
                role_name=user.role.role_name if user.role else None,
                status=user.status,
                organization=user.organization,
                bio=None,  # Would need to add bio field to User model or get from profile
                profile_picture_url=user.profile_picture,
                dataset_count=dataset_count,
                profile_completeness=profile_completeness,
                last_activity=user.last_login,
                skills=[],  # Would need to implement skills relationship
                is_verified=False  # Would need to implement verification system
            )
            user_responses.append(user_response)
        
        return UserSearchListResponse(
            users=user_responses,
            total_count=total_count,
            page=request.page,
            limit=request.limit,
            has_next=(request.page * request.limit) < total_count,
            has_prev=request.page > 1
        )
    
    def get_search_suggestions(self, db: Session, search_term: str, limit: int = 8) -> List[str]:
        """
        Get search suggestions for users based on names and organizations.
        
        Args:
            db: Database session
            search_term: Partial search term
            limit: Maximum number of suggestions
            
        Returns:
            List[str]: List of search suggestions
        """
        if not search_term or len(search_term.strip()) < 2:
            return []
        
        # Normalize search term (remove extra spaces)
        normalized_search = ' '.join(search_term.strip().split())
        search_pattern = f"%{normalized_search}%"
        suggestions = []
        
        # Search usernames and names (including concatenated full names)
        name_matches = db.query(User.username, User.first_name, User.last_name).filter(
            User.status == 'active',
            or_(
                User.username.ilike(search_pattern),
                User.first_name.ilike(search_pattern),
                User.last_name.ilike(search_pattern),
                # Search concatenated full names for suggestions too
                func.concat(
                    func.coalesce(User.first_name, ''), 
                    ' ', 
                    func.coalesce(User.last_name, '')
                ).ilike(search_pattern),
                func.concat(
                    func.coalesce(User.last_name, ''), 
                    ' ', 
                    func.coalesce(User.first_name, '')
                ).ilike(search_pattern)
            )
        ).limit(limit).all()
        
        for match in name_matches:
            if match.first_name and match.last_name:
                suggestions.append(f"{match.first_name} {match.last_name}")
            elif match.first_name:
                suggestions.append(match.first_name)
            elif match.last_name:
                suggestions.append(match.last_name)
            else:
                suggestions.append(match.username)
        
        # Search organizations if we need more suggestions
        if len(suggestions) < limit:
            remaining_limit = limit - len(suggestions)
            org_matches = db.query(User.organization).filter(
                User.status == 'active',
                User.organization.ilike(search_pattern),
                User.organization.isnot(None)
            ).distinct().limit(remaining_limit).all()
            
            for match in org_matches:
                if match.organization and match.organization not in suggestions:
                    suggestions.append(match.organization)
        
        return suggestions[:limit] 