# This file imports all models from their respective feature modules
# ensuring they are all registered with SQLAlchemy's Base metadata.

from app.features.user.models import Role, User
from app.features.dataset.models import Dataset, DatasetTag
from app.features.file.models import File
from app.features.like.models import Like
from app.features.comment.models import Comment
from app.features.tag.models import Tag

# If you want to control `from app.database.models import *` behavior,
# you can define __all__ here:
# __all__ = [
# "Role", "User", "Dataset", "DatasetTag", "File", "Like", "Comment", "Tag"
# ]
