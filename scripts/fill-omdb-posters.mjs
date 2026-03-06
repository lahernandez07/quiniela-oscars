import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const OMDB_API_KEY = process.env.OMDB_API_KEY;
const TMDB_BEARER_TOKEN = process.env.TMDB_BEARER_TOKEN;

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error("Falta NEXT_PUBLIC_SUPABASE_URL");
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY");
}

if (!OMDB_API_KEY) {
  throw new Error("Falta OMDB_API_KEY");
}

if (!TMDB_BEARER_TOKEN) {
  throw new Error("Falta TMDB_BEARER_TOKEN");
}

async function fetchPosterFromTMDb(movieTitle) {
  const searchUrl = new URL("https://api.themoviedb.org/3/search/movie");
  searchUrl.searchParams.set("query", movieTitle);
  searchUrl.searchParams.set("include_adult", "false");
  searchUrl.searchParams.set("language", "en-US");
  searchUrl.searchParams.set("page", "1");

  const searchRes = await fetch(searchUrl, {
    headers: {
      Authorization: `Bearer ${TMDB_BEARER_TOKEN}`,
      accept: "application/json",
    },
  });

  if (!searchRes.ok) {
    throw new Error(`TMDB search error: ${searchRes.status}`);
  }

  const searchData = await searchRes.json();
  const results = Array.isArray(searchData.results) ? searchData.results : [];

  const best = results.find((r) => r.poster_path) || null;

  if (!best || !best.poster_path) {
    return null;
  }

  return `https://image.tmdb.org/t/p/w500${best.poster_path}`;
}

async function fetchPoster(movieTitle) {
  const url = new URL("https://www.omdbapi.com/");
  url.searchParams.set("apikey", OMDB_API_KEY);
  url.searchParams.set("t", movieTitle);

  const res = await fetch(url);
  const data = await res.json();

  if (data.Response !== "False" && data.Poster && data.Poster !== "N/A") {
    return {
      source: "OMDb",
      url: data.Poster,
    };
  }

  const tmdbPoster = await fetchPosterFromTMDb(movieTitle);

  if (tmdbPoster) {
    return {
      source: "TMDb",
      url: tmdbPoster,
    };
  }

  return null;
}

async function main() {
  const { data: nominees, error } = await supabase
    .from("nominees")
    .select("id, label, movie_title, image_url")
    .or("image_url.is.null,image_url.eq.");

  if (error) {
    throw new Error(`Error leyendo nominees: ${error.message}`);
  }

  console.log(`Nominees sin image_url: ${nominees.length}`);

  for (const nominee of nominees) {
    const movieTitle = nominee.movie_title?.trim();

    if (!movieTitle) {
      console.log(`SKIP sin movie_title: ${nominee.label}`);
      continue;
    }

    try {
      const poster = await fetchPoster(movieTitle);

      if (!poster) {
        console.log(`SIN POSTER: ${movieTitle}`);
        continue;
      }

      const { error: updateError } = await supabase
        .from("nominees")
        .update({ image_url: poster.url })
        .eq("id", nominee.id);

      if (updateError) {
        console.log(`ERROR UPDATE ${movieTitle}: ${updateError.message}`);
        continue;
      }

      console.log(`OK [${poster.source}]: ${movieTitle}`);
    } catch (err) {
      console.log(`ERROR ${movieTitle}: ${err.message}`);
    }
  }

  console.log("Proceso terminado.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});