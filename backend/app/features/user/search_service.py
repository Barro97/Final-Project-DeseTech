"""
User Search Service - Privacy-Aware User Discovery

This service provides comprehensive user search functionality with:
- Privacy-aware filtering based on user settings
- Intelligent ranking and relevance scoring
- Multi-field search across names, organizations, skills
- Advanced filtering capabilities
- Search suggestions and autocomplete
"""

from sqlalchemy.orm import Session
from sqlalchemy import or_, and_, func, desc, asc, case
from typing import List, Tuple, Optional
import logging

from backend.app.database.models import User, Dataset, Role
from backend.app.features.user.user_schemas.search import (
    UserSearchRequest, UserSearchResponse, UserSearchListResponse
)

logger = logging.getLogger(__name__)


class UserSearchService:
    """
    Service for searching and discovering users with privacy controls.
    
    This service implements intelligent user search with:
    - Privacy-aware filtering (respects user privacy settings)
    - Relevance-based ranking algorithm
    - Multi-field search capabilities
    - Advanced filtering options
    - Performance-optimized queries
    """

    def search_users(self, db: Session, request: UserSearchRequest, 
                    viewer_user_id: Optional[int] = None) -> UserSearchListResponse:
        """
        Search users with privacy-aware filtering and intelligent ranking.
        
        Args:
            db: Database session
            request: Search request with filters and pagination
            viewer_user_id: ID of user performing search (for privacy filtering)
            
        Returns:
            UserSearchListResponse: Paginated search results with metadata
        """
        try:
            # Build base query with privacy filtering
            query = self._build_base_query(db, viewer_user_id)
            
            # Apply search filters
            query = self._apply_search_filters(db, query, request)
            
            # Get total count before pagination
            total_count = query.count()
            
            # Apply sorting
            query = self._apply_sorting(query, request.sort_by)
            
            # Apply pagination
            offset = (request.page - 1) * request.limit
            users = query.offset(offset).limit(request.limit).all()
            
            # Convert to response format
            user_responses = []
            for user in users:
                user_response = self._format_user_response(user, viewer_user_id)
                user_responses.append(user_response)
            
            return UserSearchListResponse(
                users=user_responses,
                total_count=total_count,
                page=request.page,
                limit=request.limit,
                has_next=(request.page * request.limit) < total_count,
                has_prev=request.page > 1
            )
            
        except Exception as e:
            logger.error(f"Error searching users: {str(e)}")
            raise

    def get_search_suggestions(self, db: Session, search_term: str, 
                             limit: int = 8, viewer_user_id: Optional[int] = None) -> List[str]:
        """
        Get search suggestions for user search autocomplete.
        
        Args:
            db: Database session
            search_term: Partial search term
            limit: Maximum suggestions to return
            viewer_user_id: ID of user requesting suggestions
            
        Returns:
            List[str]: Search suggestions based on user data
        """
        try:
            if not search_term or len(search_term.strip()) < 2:
                return []
            
            search_pattern = f"%{search_term.strip()}%"
            suggestions = []
            
            # Get base query with privacy filtering
            base_query = self._build_base_query(db, viewer_user_id)
            
            # Priority 1: User names (first_name + last_name)
            name_matches = base_query.filter(
                or_(
                    func.concat(User.first_name, ' ', User.last_name).ilike(search_pattern),
                    User.username.ilike(search_pattern)
                )
            ).order_by(desc(User.last_login)).limit(limit).all()
            
            for user in name_matches:
                full_name = f"{user.first_name} {user.last_name}".strip()
                if full_name and full_name not in suggestions:
                    suggestions.append(full_name)
            
            # Priority 2: Organizations (if we need more suggestions)
            if len(suggestions) < limit:
                remaining_limit = limit - len(suggestions)
                org_matches = base_query.filter(
                    User.organization.ilike(search_pattern),
                    User.organization.isnot(None)
                ).distinct(User.organization).limit(remaining_limit).all()
                
                for user in org_matches:
                    if user.organization and user.organization not in suggestions:
                        suggestions.append(user.organization)
            
            return suggestions[:limit]
            
        except Exception as e:
            logger.error(f"Error getting user search suggestions: {str(e)}")
            return []

    def _build_base_query(self, db: Session, viewer_user_id: Optional[int] = None):
        """
        Build base query with privacy filtering.
        
        Privacy Rules:
        - Public profiles: visible to everyone
        - Authenticated profiles: visible to logged-in users
        - Private profiles: only visible to owner
        - Inactive/suspended users: filtered out for regular users
        """
        query = db.query(User).join(Role, User.role_id == Role.role_id, isouter=True)
        
        # Privacy filtering
        if viewer_user_id is None:
            # Anonymous user - only public profiles
            query = query.filter(User.privacy_level == 'public')
        else:
            # Authenticated user - public + authenticated + own private
            query = query.filter(
                or_(
                    User.privacy_level == 'public',
                    User.privacy_level == 'authenticated',
                    and_(User.privacy_level == 'private', User.user_id == viewer_user_id)
                )
            )
        
        # Filter out inactive users for regular searches
        query = query.filter(User.status == 'active')
        
        return query

    def _apply_search_filters(self, db: Session, query, request: UserSearchRequest):
        """Apply search term and filter criteria to the query."""
        
        # Text search across multiple fields
        if request.search_term:
            search = f"%{request.search_term}%"
            query = query.filter(
                or_(
                    func.concat(User.first_name, ' ', User.last_name).ilike(search),
                    User.username.ilike(search),
                    User.email.ilike(search),
                    User.organization.ilike(search),
                    User.bio.ilike(search)
                )
            )
        
        # Role filtering
        if request.roles:
            query = query.filter(Role.role_name.in_(request.roles))
        
        # Organization filtering
        if request.organizations:
            query = query.filter(User.organization.in_(request.organizations))
        
        # Status filtering
        if request.status:
            query = query.filter(User.status.in_(request.status))
        
        # Dataset count filtering
        if request.has_datasets is not None:
            dataset_subquery = db.query(Dataset.uploader_id).filter(
                Dataset.approval_status == 'approved'
            ).subquery()
            
            if request.has_datasets:
                query = query.filter(User.user_id.in_(dataset_subquery))
            else:
                query = query.filter(~User.user_id.in_(dataset_subquery))
        
        if request.min_datasets is not None:
            # Count datasets per user and filter
            dataset_counts = db.query(
                Dataset.uploader_id,
                func.count(Dataset.dataset_id).label('dataset_count')
            ).filter(Dataset.approval_status == 'approved').group_by(Dataset.uploader_id).subquery()
            
            query = query.join(dataset_counts, User.user_id == dataset_counts.c.uploader_id)
            query = query.filter(dataset_counts.c.dataset_count >= request.min_datasets)
        
        return query

    def _apply_sorting(self, query, sort_by: str):
        """Apply sorting to the query based on sort criteria."""
        
        if sort_by == "name":
            query = query.order_by(asc(User.first_name), asc(User.last_name))
        elif sort_by == "recent":
            query = query.order_by(desc(User.last_login))
        elif sort_by == "datasets":
            # Sort by dataset count (requires subquery)
            dataset_counts = query.session.query(
                Dataset.uploader_id,
                func.count(Dataset.dataset_id).label('dataset_count')
            ).filter(Dataset.approval_status == 'approved').group_by(Dataset.uploader_id).subquery()
            
            query = query.outerjoin(dataset_counts, User.user_id == dataset_counts.c.uploader_id)
            query = query.order_by(desc(func.coalesce(dataset_counts.c.dataset_count, 0)))
        elif sort_by == "activity":
            query = query.order_by(desc(User.last_login))
        else:  # relevance (default)
            # Relevance scoring based on profile completeness and activity
            relevance_score = case(
                (User.last_login.isnot(None), 3),
                else_=1
            ) + case(
                (User.bio.isnot(None), 1),
                else_=0
            ) + case(
                (User.organization.isnot(None), 1),
                else_=0
            )
            query = query.order_by(desc(relevance_score), desc(User.last_login))
        
        return query

    def _format_user_response(self, user: User, viewer_user_id: Optional[int] = None) -> UserSearchResponse:
        """
        Format user data for search response with privacy filtering.
        
        Args:
            user: User database model
            viewer_user_id: ID of user viewing the results
            
        Returns:
            UserSearchResponse: Formatted user data for API response
        """
        # Calculate dataset count
        dataset_count = len([d for d in user.datasets if d.approval_status == 'approved'])
        
        # Calculate profile completeness
        completeness_score = 0
        if user.first_name and user.last_name:
            completeness_score += 1
        if user.bio:
            completeness_score += 1
        if user.organization:
            completeness_score += 1
        if user.profile_picture:
            completeness_score += 1
        
        if completeness_score >= 3:
            profile_completeness = "complete"
        elif completeness_score >= 2:
            profile_completeness = "intermediate"
        else:
            profile_completeness = "basic"
        
        # Privacy-aware email display
        show_email = (
            viewer_user_id == user.user_id or  # Own profile
            user.privacy_level == 'public' or  # Public profile
            (user.privacy_level == 'authenticated' and viewer_user_id is not None)  # Authenticated viewing authenticated
        )
        
        return UserSearchResponse(
            user_id=user.user_id,
            username=user.username,
            full_name=f"{user.first_name} {user.last_name}".strip() or user.username,
            email=user.email if show_email else "Private",
            role_name=user.role.role_name if user.role else None,
            status=user.status,
            organization=user.organization,
            bio=user.bio,
            profile_picture_url=user.profile_picture,
            dataset_count=dataset_count,
            profile_completeness=profile_completeness,
            last_activity=user.last_login,
            skills=[],  # TODO: Implement skills system if needed
            is_verified=user.role and user.role.role_name in ['admin', 'moderator']
        ) 