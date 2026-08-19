from supabase import Client


class SupabaseStorage:
    def __init__(self, client: Client):
        self.client = client

    async def upload_file(self, bucket: str, path: str, content: bytes) -> str:
        # supabase-py storage operations are synchronous
        res = self.client.storage.from_(bucket).upload(
            path=path,
            file=content,
            file_options={"upsert": "true"}
        )
        return path

    async def get_signed_url(self, bucket: str, path: str, expires_in: int = 3600) -> str:
        res = self.client.storage.from_(bucket).create_signed_url(path, expires_in)
        return res["signedURL"]
