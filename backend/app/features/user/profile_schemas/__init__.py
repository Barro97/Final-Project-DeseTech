# Export all schema classes for easy import
from .request import *
from .response import *
from .internal import *

# Import and re-export the original user schemas from the parent schemas.py
# This maintains backward compatibility while we transition to the new structure
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(__file__)))

try:
    from ..schemas import UserCreate, UserUpdate, User, UserBase, UserLogin, UserDelete
    
    # Re-export for backward compatibility
    __all__ = [
        'UserCreate', 'UserUpdate', 'User', 'UserBase', 'UserLogin', 'UserDelete',
        # Plus all the new schemas from the modules above
    ]
except ImportError:
    # If the old schemas don't exist, that's okay
    pass 