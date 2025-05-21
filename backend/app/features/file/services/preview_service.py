from typing import Any, Dict, List, Optional
import csv
import json
import io
from ..utils.storage import FileStorageProvider, storage_provider
import logging

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        """
        Get a preview of a JSON file.
        
        Supports both JSON arrays and JSON objects.
        For JSON arrays, it returns array elements.
        For JSON objects, it wraps the object in an array.
        """
        # For JSON, we need to read the entire file for proper parsing
        buffer = io.StringIO()
        total_content = ""
        
        try:
            # Read the entire file - for JSON we can't easily do chunk-based parsing
            async for chunk in self.storage.get_byte_range(file_path, 0, None):
                chunk_text = chunk.decode('utf-8', errors='replace')
                total_content += chunk_text
            
            logger.info(f"Read {len(total_content)} bytes from JSON file {file_path}")
            if not total_content.strip():
                logger.warning(f"JSON file {file_path} is empty")
                return PreviewResponse(
                    data=[],
                    total_size=0,
                    has_more=False,
                    current_offset=0,
                    file_type="application/json"
                )
            
            # Try to parse the entire content
            try:
                data = json.loads(total_content)
                logger.info(f"Successfully parsed JSON data of type {type(data)}")
                
                # Handle different JSON structures
                if isinstance(data, list):
                    # It's already a list/array, use it directly
                    all_items = data
                    logger.info(f"JSON is a list with {len(all_items)} items")
                elif isinstance(data, dict):
                    # It's a single object, wrap it in a list
                    all_items = [data]
                    logger.info("JSON is a single object, wrapped in a list")
                else:
                    # It's a primitive value (string, number, etc.)
                    all_items = [{"value": data}]
                    logger.info(f"JSON is a primitive value of type {type(data)}")
                
                # Calculate the slice for pagination
                start_idx = min(offset, len(all_items))
                end_idx = min(start_idx + max_rows, len(all_items))
                
                preview_data = all_items[start_idx:end_idx]
                has_more = end_idx < len(all_items)
                current_offset = end_idx
                
                logger.info(f"Returning {len(preview_data)} items from offset {offset}")
                
                return PreviewResponse(
                    data=preview_data,
                    total_size=len(all_items),
                    has_more=has_more,
                    current_offset=current_offset,
                    file_type="application/json"
                )
                
            except json.JSONDecodeError as e:
                # JSON parsing failed
                logger.error(f"JSON decode error: {str(e)}")
                logger.error(f"First 100 chars of content: {total_content[:100]}...")
                
                # Provide a helpful error message in the preview
                error_obj = [{
                    "error": "Invalid JSON format",
                    "message": f"The file could not be parsed as valid JSON: {str(e)}",
                    "details": "Please ensure the file contains valid JSON data."
                }]
                
                return PreviewResponse(
                    data=error_obj,
                    total_size=len(total_content),
                    has_more=False,
                    current_offset=0,
                    file_type="application/json"
                )
        
        except Exception as e:
            # Handle any other errors during file reading
            logger.exception(f"Error reading JSON file {file_path}: {str(e)}")
            error_obj = [{
                "error": "File reading error",
                "message": f"An error occurred while reading the file: {str(e)}",
                "details": "Please try again or contact support if the issue persists."
            }]
            
            return PreviewResponse(
                data=error_obj,
                total_size=0,
                has_more=False,
                current_offset=0,
                file_type="application/json"
            )

# Create a global instance of the preview service
preview_service = FilePreviewService(storage_provider) 