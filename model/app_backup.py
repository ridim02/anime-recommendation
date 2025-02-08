import pandas as pd
import tensorflow as tf

import numpy as np
import pandas as pd

from collections import defaultdict
import matplotlib.pyplot as plt

from fastapi import FastAPI

app = FastAPI()

def extract_weights(name, model):
    weight_layer = model.get_layer(name)
    weights = weight_layer.get_weights()[0]
    weights = weights / np.linalg.norm(weights, axis = 1).reshape((-1, 1))
    return weights

def getAnimeName(anime_id):
    try:
        name = df[df.anime_id == anime_id].eng_version.values[0]
        if name is np.nan:
            name = df[df.anime_id == anime_id].Name.values[0]
    except:
        print('error')
    
    return name

def getSypnopsis(anime):
    if isinstance(anime, int):
        return sypnopsis_df[sypnopsis_df.MAL_ID == anime].sypnopsis.values[0]
    if isinstance(anime, str):
        return sypnopsis_df[sypnopsis_df.Name == anime].sypnopsis.values[0]

def getAnimeFrame(anime):
    if isinstance(anime, int):
        return df[df.anime_id == anime]
    if isinstance(anime, str):
        return df[df.eng_version == anime]

def find_similar_animes(name, n=10, return_dist=False, neg=False):
    try:
        index = getAnimeFrame(name).anime_id.values[0]
        encoded_index = anime2anime_encoded.get(index)
        weights = anime_weights
        
        dists = np.dot(weights, weights[encoded_index])
        sorted_dists = np.argsort(dists)
        
        n = n + 1            
        
        if neg:
            closest = sorted_dists[:n]
        else:
            closest = sorted_dists[-n:]

        print('animes closest to {}'.format(name))

        if return_dist:
            return dists, closest
        
        rindex = df

        SimilarityArr = []

        for close in closest:
            decoded_id = anime_encoded2anime.get(close)
            sypnopsis = getSypnopsis(decoded_id)
            anime_frame = getAnimeFrame(decoded_id)
            
            anime_name = anime_frame.eng_version.values[0]
            genre = anime_frame.Genres.values[0]
            similarity = float(dists[close])
            SimilarityArr.append({"anime_id": decoded_id, "name": anime_name,
                                  "similarity": similarity,"genre": genre,
                                  'sypnopsis': sypnopsis})

        return SimilarityArr

    except Exception as e:
        print(e)
        print('{}!, Not Found in Anime list'.format(name))

def find_similar_users(item_input:int, n=10,return_dist=False, neg=False):
    try:
        index = item_input
        encoded_index = user2user_encoded.get(index)
        weights = user_weights
    
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
        
        print("> Genre list:")
        print(genres_list)
        return(genres_list)
    
    except Exception as e:
        print("getFavGenre")
        print(e)

def get_user_preferences(user_id, plot=False, verbose=0):
    try:    
        animes_watched_by_user = rating_df[rating_df.user_id==user_id]
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
        
            print('> preferred genres')
        
        if plot:
            genres_list = getFavGenre(anime_df_rows, plot)
            return anime_df_rows, genres_list#.eng_version.values
        
        return anime_df_rows
    except Exception as e:
        print("get_user_preferences")
        print(e)

def get_recommended_animes(similar_users, n=10):
    recommended_animes = []
    anime_list = []
    for user_id in similar_users.similar_users.values:
        user_pref = get_user_preferences(user_id, plot=True, verbose=1)
        pref_list, genres = get_user_preferences(int(user_id), verbose=0)
        pref_list = pref_list[~ pref_list.eng_version.isin(user_pref.eng_version.values)]
        anime_list.append(pref_list.eng_version.values)
        
    anime_list = pd.DataFrame(anime_list)
    sorted_list = pd.DataFrame(pd.Series(anime_list.values.ravel()).value_counts()).head(n)
    
    for i, anime_name in enumerate(sorted_list.index):        
        n_user_pref = sorted_list[sorted_list.index == anime_name].values[0][0]
        if isinstance(anime_name, str):
            try:
                frame = getAnimeFrame(anime_name)
                anime_id = frame.anime_id.values[0]
                genre = frame.Genres.values[0]
                sypnopsis = getSypnopsis(int(anime_id))
                recommended_animes.append({#"anime_id": anime_id ,
                                            "n": n_user_pref,
                                            "anime_name": anime_name, 
                                            "Genres": genre, 
                                            "sypnopsis": sypnopsis})
            except:
                pass
    
    return recommended_animes

MODEL_PATH = './saved_model/my_model.h5'
model = tf.keras.models.load_model(MODEL_PATH)

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

AvgRating = np.mean(rating_df['rating'])

duplicates = rating_df.duplicated()

if duplicates.sum() > 0:
    print('> {} duplicates'.format(duplicates.sum()))
    rating_df = rating_df[~duplicates]

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

rating_df = rating_df.sample(frac=1, random_state=73)

anime_weights = extract_weights('anime_embedding', model)
user_weights = extract_weights('user_embedding', model)

df = pd.read_csv(INPUT_DIR + '/anime.csv', low_memory=True)
df = df.replace("Unknown", np.nan)

df['anime_id'] = df['MAL_ID']
df["eng_version"] = df['English name']
df['eng_version'] = df.anime_id.apply(lambda x: getAnimeName(x))

df.sort_values(by=['Score'], 
               inplace=True,
               ascending=False, 
               kind='quicksort',
               na_position='last')

df = df[["anime_id", "eng_version", 
         "Score", "Genres", "Episodes", 
         "Type", "Premiered", "Members"]]

cols = ["MAL_ID", "Name", "Genres", "sypnopsis"]
sypnopsis_df = pd.read_csv(INPUT_DIR + '/anime_with_synopsis.csv', usecols=cols)

pd.set_option("max_colwidth", None)

print("Server ready... ")

@app.get("/")
def read_root():
    return {"message": "Anime Recommendation API is running"}

def GetRandomUsers():
    users = []
    for i in range(5):
        ratings_per_user = rating_df.groupby('user_id').size()
        random_user = ratings_per_user[ratings_per_user < 500].sample(1, random_state=None).index[0]
        users[i] = random_user
    return users

def GetGroupRecommendation(users):
    user_pref = []
    for user in users:
        user_pref.append(get_recommendations(user))
    return user_pref

@app.get("/random-group/users")
def getRandomGroupOfUsers():
    try:
        users = GetRandomUsers()
        return users
    except Exception as e:
        print("/random-group/users")
        print(e)

@app.get("/user/highly-rated/{user_id}")
def get_highly_rated_animes(user_id):
    try:
        return get_user_preferences(user_id)
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
        
@app.get("/user/similar-anime/{name}")
def get_similar_users(name: str):
    try:
        return find_similar_animes(name, n=5, neg=False)
    except Exception as e:
        print(e)

@app.get("/user/get-recommendations/{user_id}")
def get_recommendations(user_id):
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

        top_ratings_indices = (-ratings).argsort()[:10]

        recommended_anime_ids = [
            anime_encoded2anime.get(anime_not_watched[x][0]) for x in top_ratings_indices
        ]
        
        Results = []
        top_rated_ids = []

        for index, anime_id in enumerate(anime_not_watched):
            rating = ratings[index]
            rating = float(np.nan_to_num(rating, nan=0.0, posinf=1.0, neginf=0.0))
            id_ = anime_encoded2anime.get(anime_id[0])
            
            if id_ in recommended_anime_ids:
                top_rated_ids.append(id_)
                try:
                    condition = (df.anime_id == id_)
                    name = df[condition]['eng_version'].values[0]
                    genre = df[condition].Genres.values[0]
                    score = df[condition].Score.values[0]
                    sypnopsis = getSypnopsis(int(id_))
                except:
                    continue
                    
                Results.append({"anime_id": int(id_), 
                                "name": str(name), 
                                "pred_rating": float(rating),
                                "genre": str(genre), 
                                'sypnopsis': str(sypnopsis)})
        return Results
    
    except Exception as e:
        print(e)
