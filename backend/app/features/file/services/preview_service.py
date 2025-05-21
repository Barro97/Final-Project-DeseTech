from typing import Any, Dict, List, Optional
import csv
import json
import io
from ..utils.storage import FileStorageProvider, storage_provider

class PreviewResponse:
    def __init__(
        self,
        data: List[Any],
        total_size: int,
        has_more: bool,
        current_offset: int,
        file_type: str,
        headers: Optional[List[str]] = None
    ):
        self.data = data
        self.total_size = total_size
        self.has_more = has_more
        self.current_offset = current_offset
        self.file_type = file_type
        self.headers = headers

    def dict(self) -> Dict[str, Any]:
        return {
            "data": self.data,
            "total_size": self.total_size,
            "has_more": self.has_more,
            "current_offset": self.current_offset,
            "file_type": self.file_type,
            "headers": self.headers
        }

class FilePreviewService:
    def __init__(self, storage_provider: FileStorageProvider):
        self.storage = storage_provider
        self.chunk_size = 1024 * 64  # 64KB chunks

    async def get_preview_chunk(
        self,
        file_path: str,
        file_type: str,
        offset: int = 0,
        max_rows: int = 50
    ) -> PreviewResponse:
        if file_type == "text/csv":
            return await self._get_csv_preview(file_path, offset, max_rows)
        elif file_type == "application/json":
            return await self._get_json_preview(file_path, offset, max_rows)
        else:
            raise ValueError(f"Unsupported file type: {file_type}")

    async def _get_csv_preview(
        self,
        file_path: str,
        offset: int,
        max_rows: int
    ) -> PreviewResponse:
        # Get initial chunk
        buffer = io.StringIO()
        async for chunk in self.storage.get_byte_range(file_path, offset, offset + self.chunk_size):
            buffer.write(chunk.decode('utf-8'))
        
        buffer.seek(0)
        reader = csv.reader(buffer)
        
        # Get headers if we're at the start of the file
        headers = next(reader) if offset == 0 else None
        
        # Read requested number of rows
        rows = []
        for _ in range(max_rows):
            try:
                row = next(reader)
                rows.append(row)
            except StopIteration:
                break
        
        # Check if there's more data
        try:
            next(reader)
            has_more = True
        except StopIteration:
            has_more = False
        
        total_size = await self.storage.get_file_size(file_path)
        current_offset = offset + buffer.tell()
        
        return PreviewResponse(
            data=rows,
            total_size=total_size,
            has_more=has_more,
            current_offset=current_offset,
            file_type="text/csv",
            headers=headers
        )

    async def _get_json_preview(
        self,
        file_path: str,
        offset: int,
        max_rows: int
    ) -> PreviewResponse:
        # For JSON, we need to be careful about partial objects
        buffer = io.StringIO()
        async for chunk in self.storage.get_byte_range(file_path, offset, offset + self.chunk_size):
            buffer.write(chunk.decode('utf-8'))
        
        buffer.seek(0)
        content = buffer.read()
        
        try:
            # Try to parse as array
            data = json.loads(content)
            if not isinstance(data, list):
                data = [data]  # Single object
            
            # Take only requested number of items
            preview_data = data[:max_rows]
            has_more = len(data) > max_rows
            
        except json.JSONDecodeError:
            # Handle partial JSON by finding the last complete object
            last_complete = content.rfind("}") + 1
            valid_content = content[:last_complete]
            try:
                data = json.loads(valid_content)
                if not isinstance(data, list):
                    data = [data]
                preview_data = data[:max_rows]
                has_more = True
            except json.JSONDecodeError:
                preview_data = []
                has_more = True
        
        total_size = await self.storage.get_file_size(file_path)
        current_offset = offset + len(content)
        
        return PreviewResponse(
            data=preview_data,
            total_size=total_size,
            has_more=has_more,
            current_offset=current_offset,
            file_type="application/json"
        )

# Create a global instance of the preview service
preview_service = FilePreviewService(storage_provider) 