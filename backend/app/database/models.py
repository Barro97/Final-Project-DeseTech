# This file imports all models from their respective feature modules
# ensuring they are all registered with SQLAlchemy's Base metadata.

from backend.app.database.base import Base
from backend.app.features.user.models import Role, User
from backend.app.features.dataset.models import Dataset, DatasetTag, AdminAudit, dataset_owner_table as DatasetOwner
from backend.app.features.file.models import File
from backend.app.features.like.models import Like
from backend.app.features.comment.models import Comment
from backend.app.features.tag.models import Tag

# If you want to control `from app.database.models import *` behavior,
# you can define __all__ here:
__all__ = [
    "Base",
    "Role", "User", "Dataset", "DatasetTag", "AdminAudit", "File", "Like", "Comment", "Tag",
    "DatasetOwner"
]
