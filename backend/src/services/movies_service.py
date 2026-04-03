from typing import Any, Dict, List
from pydantic import BaseModel, Field

from shared.constants import DEFAULT_PAGE_SIZE, MONGODB_DB
from shared.database import get_mongo_client, coerce_object_id, normalize_movie_doc


class Movie(BaseModel):
    id: str = Field(alias="_id")
    title: str | None = None
    year: int | None = None
    genres: List[str] = Field(default_factory=list)
    runtime: int | None = None
    poster: str | None = None

    class Config:
        populate_by_name = True
        extra = "ignore"


class MovieDetail(Movie):
    plot: str | None = None
    fullplot: str | None = None
    cast: List[str] = Field(default_factory=list)
    directors: List[str] = Field(default_factory=list)
    countries: List[str] = Field(default_factory=list)
    language: str | None = None
    rated: str | None = None
    released: str | None = None


def get_movies(page: int, query: str = None) -> Dict[str, Any]:
    client = get_mongo_client()
    db = client[MONGODB_DB]
    collection = db["movies"]
    
    skip = (page - 1) * DEFAULT_PAGE_SIZE
    filter_query = {}

    if query:
        filter_query["title"] = {"$regex": query, "$options": "i"}

    total = collection.count_documents(filter_query)
    projection = {"_id": 1, "title": 1, "year": 1, "genres": 1, "runtime": 1, "poster": 1}
    docs = list(
        collection.find(filter_query, projection).sort("_id", 1).skip(skip).limit(DEFAULT_PAGE_SIZE)
    )

    movies: List[Dict[str, Any]] = []
    for doc in docs:
        normalized = normalize_movie_doc(doc)
        movie = Movie.model_validate(normalized)
        movies.append(movie.model_dump(by_alias=True))

    return {
        "ok": True,
        "path": "/movies",
        "page": page,
        "page_size": DEFAULT_PAGE_SIZE,
        "total": total,
        "data": movies,
    }


def get_movie_by_id(movie_id: str) -> Dict[str, Any]:
    client = get_mongo_client()
    db = client[MONGODB_DB]
    collection = db["movies"]

    lookup_id = coerce_object_id(movie_id)
    doc = collection.find_one(
        {"_id": lookup_id},
        {
            "_id": 1,
            "title": 1,
            "year": 1,
            "genres": 1,
            "runtime": 1,
            "poster": 1,
            "plot": 1,
            "fullplot": 1,
            "cast": 1,
            "directors": 1,
            "countries": 1,
            "language": 1,
            "rated": 1,
            "released": 1,
        },
    )

    if not doc:
        raise ValueError(f"Movie not found: {movie_id}")

    normalized = normalize_movie_doc(doc)
    movie = MovieDetail.model_validate(normalized)
    return movie.model_dump(by_alias=True)
