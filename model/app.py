import pandas as pd
import tensorflow as tf
import numpy as np

from collections import defaultdict
from fastapi import FastAPI

app = FastAPI()

# anime helper functions

def getAnimeName(anime_id):
    try:
        name = df[df.anime_id == anime_id].eng_version.values[0]
        if name is np.nan:
            name = df[df.anime_id == anime_id].Name.values[0]
    except:
        print('error')
    
    return name

def getAnimeFrame(anime):
    if isinstance(anime, int):
        return df[df.anime_id == anime]
    if isinstance(anime, str):
        return df[df.eng_version == anime]

def SearchAnime(name):
    return df[df['eng_version'].str.contains(name, case=False, na=False)]['anime_id'].head(10)

def find_similar_animes(name, n=10, return_dist=False, neg=False):
    try:
        index = getAnimeFrame(name).anime_id.values[0]
        encoded_index = anime2anime_encoded.get(index)
        
        weights = extract_weights('anime_embedding', model)
        
        dists = np.dot(weights, weights[encoded_index])
        sorted_dists = np.argsort(dists)
        
        n = n + 1            
        closest = sorted_dists[-n:]
        
        SimilarityArr = []

        for close in closest:
            decoded_id = anime_encoded2anime.get(close)
            SimilarityArr.append(decoded_id)

        return SimilarityArr

    except Exception as e:
        print(e)
        print('{}!, Not Found in Anime list'.format(name))

def GetAnimesByGenre(df, genre, user_id):
    try:
        df = df.assign(Genres=df['Genres'].str.split(',')).explode('Genres')
        df['Genres'] = df['Genres'].str.strip()
        
        user_id = np.int64(user_id)
        animes_watched_by_user = rating_df[rating_df.user_id==user_id]
        anime_not_watched_df = df[
            ~df["anime_id"].isin(animes_watched_by_user.anime_id.values)
        ]
        
        df_genre = anime_not_watched_df[anime_not_watched_df['Genres'] == genre]
        df_sorted = df_genre.sort_values(by='Score', ascending=False)
        
        anime_ids = df_sorted.head(10)['anime_id'].values
    except Exception as e:
        print("GetAnimesByGenre")
        print("Error: "+e)
    return anime_ids

# user helper functions

def find_similar_users(item_input:int, n=10,return_dist=False, neg=False):
    try:
        index = item_input
        encoded_index = user2user_encoded.get(index)
        
        weights = extract_weights('user_embedding', model)
    
        dists = np.dot(weights, weights[encoded_index])
        sorted_dists = np.argsort(dists)
        
        n = n + 1
        
        if neg:
            closest = sorted_dists[:n]
        else:
            closest = sorted_dists[-n:]

        print('> users similar to #{}'.format(item_input))

        if return_dist:
            return dists, closest
        
        rindex = df
        SimilarityArr = []
        
        for close in closest:
            similarity = dists[close]

            if isinstance(item_input, int):
                decoded_id = user_encoded2user.get(close)
                SimilarityArr.append({"similar_users": decoded_id, 
                                      "similarity": similarity})
        print(SimilarityArr)
        Frame = pd.DataFrame(SimilarityArr).sort_values(by="similarity", 
                                                        ascending=False)
        
        return Frame
    
    except Exception as e:
        print('find_similar_users')
        print(e)

def get_user_preferences(user_id, plot=False, verbose=0):
    try:    
        animes_watched_by_user = rating_df[rating_df.user_id==int(user_id)]
        user_rating_percentile = np.percentile(animes_watched_by_user.rating, 75)
        animes_watched_by_user = animes_watched_by_user[animes_watched_by_user.rating >= user_rating_percentile]
        top_animes_user = (
            animes_watched_by_user.sort_values(by="rating", ascending=False)#.head(10)
            .anime_id.values
        )
        anime_df_rows = df[df["anime_id"].isin(top_animes_user)]
        anime_df_rows = anime_df_rows[["anime_id","eng_version", "Genres"]]
        
        if verbose != 0:
            print("> User #{} has rated {} movies (avg. rating = {:.1f})".format(
            user_id, len(animes_watched_by_user),
            animes_watched_by_user['rating'].mean(),
            ))
        
        
        if plot:
            print('> preferred genres')
            genres_list = getFavGenre(anime_df_rows, plot)
            return anime_df_rows.to_dict(orient="records"), genres_list#.eng_version.values
        
        return anime_df_rows.to_dict(orient="records")
    except Exception as e:
        print("get_user_preferences")
        print(e)

def GetRandomUsers():
    users = []
    for i in range(5):
        ratings_per_user = rating_df.groupby('user_id').size()
        random_user = ratings_per_user[ratings_per_user < 500].sample(1, random_state=None).index[0]
        users.append(int(random_user))
    return users

def find_common_anime(user_recommendations, min_count=3):
    anime_count = defaultdict(int)
    for recommendations in user_recommendations:
        for anime_id in set(recommendations):
            anime_count[anime_id] += 1

    common_anime = [anime_id for anime_id, count in anime_count.items() if count >= min_count]

    return common_anime

def getFavGenre(frame, plot=False):
    try:
        frame.dropna(inplace=False)
        all_genres = defaultdict(int)
        genres_list = []
        for genres in frame['Genres']:
            if isinstance(genres, str):
                for genre in genres.split(','):
                    if genre.strip() not in genres_list:
                        genres_list.append(genre.strip())
                        all_genres[genre.strip()] += 1    
                        
        return(genres_list)
    
    except Exception as e:
        print("getFavGenre")
        print(e)

# model initialization

MODEL_PATH = './saved_model/my_model.h5'
model = tf.keras.models.load_model(MODEL_PATH)

#global variables initialization

INPUT_DIR = 'E:/anime-recommendation/data'
rating_df = pd.read_csv(INPUT_DIR + '/animelist.csv', 
                            usecols=["user_id", "anime_id", "rating"]
                            #, nrows=90000000
                            )

n_ratings = rating_df['user_id'].value_counts()
rating_df = rating_df[rating_df['user_id'].isin(n_ratings[n_ratings >= 400].index)].copy()

min_rating = min(rating_df['rating'])
max_rating = max(rating_df['rating'])
avg_rating = np.mean(rating_df['rating'])
rating_df['rating'] = rating_df["rating"].apply(lambda x: (x - min_rating) / (max_rating - min_rating)).values.astype(np.float64)

# encoding categorical data start

user_ids = rating_df["user_id"].unique().tolist()
user2user_encoded = {x: i for i, x in enumerate(user_ids)}
user_encoded2user = {i: x for i, x in enumerate(user_ids)}
rating_df["user"] = rating_df["user_id"].map(user2user_encoded)
n_users = len(user2user_encoded)

anime_ids = rating_df["anime_id"].unique().tolist()
anime2anime_encoded = {x: i for i, x in enumerate(anime_ids)}
anime_encoded2anime = {i: x for i, x in enumerate(anime_ids)}
rating_df["anime"] = rating_df["anime_id"].map(anime2anime_encoded)
n_animes = len(anime2anime_encoded)

#encoding categorical data end

df = pd.read_csv(INPUT_DIR + '/anime.csv', low_memory=True)
df = df.replace("Unknown", np.nan)

df['anime_id'] = df['MAL_ID']
df["eng_version"] = df['English name']
df['eng_version'] = df.anime_id.apply(lambda x: getAnimeName(x))

df = df[["anime_id", "eng_version", "Genres", "Score"]]

print("Server ready... ")

# data preprocessing functions

def extract_weights(name, model):
    weight_layer = model.get_layer(name)
    weights = weight_layer.get_weights()[0]
    weights = weights / np.linalg.norm(weights, axis = 1).reshape((-1, 1))
    return weights


# recommendation function

def get_recommendations(user_id, n=500):
    try:
        user_id = np.int64(user_id)
        animes_watched_by_user = rating_df[rating_df.user_id==user_id]
        anime_not_watched_df = df[
            ~df["anime_id"].isin(animes_watched_by_user.anime_id.values)
        ]
        
        anime_not_watched = list(
            set(anime_not_watched_df['anime_id']).intersection(set(anime2anime_encoded.keys()))
        )

        anime_not_watched = [[anime2anime_encoded.get(x)] for x in anime_not_watched]

        user_encoder = user2user_encoded.get(user_id)

        user_anime_array = np.hstack(
            ([[user_encoder]] * len(anime_not_watched), anime_not_watched)
        )

        user_anime_array = [user_anime_array[:, 0], user_anime_array[:, 1]]
        ratings = model.predict(user_anime_array).flatten()

        top_ratings_indices = (-ratings).argsort()[:int(n)]

        recommended_anime_ids = [
            anime_encoded2anime.get(anime_not_watched[x][0]) for x in top_ratings_indices
        ]
        top_rated_ids = []

        for index, anime_id in enumerate(anime_not_watched):
            id_ = anime_encoded2anime.get(anime_id[0])
            
            if id_ in recommended_anime_ids:
                top_rated_ids.append(id_)
        return top_rated_ids
    
    except Exception as e:
        print(e)

def GetGroupRecommendation(users):
    user_pref = []
    for user in users:
        user_pref.append(get_recommendations(user))
    common_anime_ids = find_common_anime(user_pref, min_count=3)
    return common_anime_ids

# API endpoints

@app.get("/")
def read_root():
    return {"message": "Anime Recommendation API is running"}

@app.get("/group/users")
def getRandomGroupOfUsers():
    try:
        users = GetRandomUsers()
        return users
    except Exception as e:
        print("/random-group/users")
        print(e)
        
@app.get("/anime-by-genre/{genre}/{userid}")
def getAnimeByGenre(genre, userid):
    try:
        anime_ids = GetAnimesByGenre(df, str(genre), int(userid))
        return anime_ids.tolist()
    except Exception as e:
        print("/anime-by-genre")
        print(e)

@app.get("/group/random/recommendations")
def get_group_recommendations():
    try:
        users = GetRandomUsers()
        users_arr = []
        user_pref = []
        for user in users:
            user_pref.append(get_recommendations(user))
            users_arr.append(int(user))
        common_anime_ids = find_common_anime(user_pref, min_count=3)
        return {"anime_ids": common_anime_ids, "user_ids": users_arr}
    
    except Exception as e: 
        print("/get-group-recommendation")
        print(e)

@app.get("/user/preferences/{user_id}")
def get_highly_rated_animes(user_id):
    try:
        anime_df_rows, genres_list = get_user_preferences(user_id, plot=True)
        return {"anime_ids": anime_df_rows, "genres": genres_list}
    except Exception as e:
        print(e)

@app.get("/user/similar-users/{user_id}")
def get_similar_users(user_id):
    try:
        user_id = np.int64(user_id)
        similar_users = find_similar_users( int(user_id), n=5, neg=False)
        
        similar_users = similar_users[similar_users.similarity > 0.4]
        similar_users = similar_users[similar_users.similar_users != user_id]
        
        return similar_users.to_dict(orient="records")
    
    except Exception as e:
        print(e)
        
@app.get("/user/similar-anime/{anime_id}")
def get_similar_anime(anime_id: int):
    try:
        return find_similar_animes(anime_id, n=10, neg=False)
    except Exception as e:
        print(e)
      
@app.get("/anime-by-name/{name}")
def get_anime_byname(name: str):
    try:
        anime_ids = SearchAnime(str(name))
        return SearchAnime(str(name)).tolist()
    except Exception as e:
        print(e)

@app.get("/user/get-recommendations/{user_id}/{n}")
def get_user_recommendations(user_id, n=500):
    return get_recommendations(user_id, n)