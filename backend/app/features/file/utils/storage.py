from abc import ABC, abstractmethod
from typing import AsyncIterator, Optional
from fastapi import HTTPException
from .upload import client, SUPABASE_STORAGE_BUCKET
import io
import asyncio

class FileStorageProvider(ABC):
    """Abstract base class for file storage providers."""
    
    @abstractmethod
    async def get_byte_range(self, file_path: str, start: int, end: Optional[int] = None) -> AsyncIterator[bytes]:
        """Get a range of bytes from a file."""
        pass
    
    @abstractmethod
    async def get_file_size(self, file_path: str) -> int:
        """Get the total size of a file."""
        pass

class SupabaseStorageProvider(FileStorageProvider):
    """Supabase implementation of the file storage provider."""
    
    CHUNK_SIZE = 8192  # 8KB chunks for streaming
    
    async def get_byte_range(self, file_path: str, start: int, end: Optional[int] = None) -> AsyncIterator[bytes]:
        try:
            # Use asyncio to run the synchronous download in a thread pool
            file_bytes = await asyncio.to_thread(
                lambda: client.storage.from_(SUPABASE_STORAGE_BUCKET).download(file_path)
            )
            
            # Create a bytes IO object for streaming
            file_io = io.BytesIO(file_bytes)
            file_io.seek(start)
            
            # If end is not specified, read until EOF
            remaining = end - start if end else float('inf')
            
            while remaining > 0:
                chunk_size = min(self.CHUNK_SIZE, remaining if end else self.CHUNK_SIZE)
                chunk = file_io.read(chunk_size)
                
                if not chunk:
                    break
                    
                yield chunk
                remaining -= len(chunk)
                
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to read file from storage: {str(e)}"
            )
    
    async def get_file_size(self, file_path: str) -> int:
        try:
            # Use asyncio to run the synchronous download in a thread pool
            file_bytes = await asyncio.to_thread(
                lambda: client.storage.from_(SUPABASE_STORAGE_BUCKET).download(file_path)
            )
            return len(file_bytes)
        except Exception as e:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to get file size: {str(e)}"
            )

# Create a global instance of the storage provider
storage_provider = SupabaseStorageProvider() 