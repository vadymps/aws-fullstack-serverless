import os

DEFAULT_PAGE_SIZE = 12
FAVORITES_PAGE_SIZE = 12
MONGODB_URI = os.getenv("MONGODB_URI")
MONGODB_DB = os.getenv("MONGODB_DB")
AVATARS_BUCKET = os.getenv("AVATARS_BUCKET")

MAX_AVATAR_BYTES = 5 * 1024 * 1024
ALLOWED_IMAGE_TYPES = {"image/jpeg", "image/png", "image/webp"}
