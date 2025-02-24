import numpy as np
import pandas as pd
import tensorflow as tf
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

INPUT_DIR = 'E:/anime-recommendation/data'
test_set_size = 10000

rating_df = pd.read_csv(INPUT_DIR + '/animelist.csv', 
                        low_memory=False, 
                        usecols=["user_id", "anime_id", "rating"])

min_rating = rating_df['rating'].min()
max_rating = rating_df['rating'].max()
rating_df['rating'] = rating_df["rating"].apply(lambda x: (x - min_rating) / (max_rating - min_rating)).values.astype(np.float64)

user_ids = rating_df["user_id"].unique().tolist()
user2user_encoded = {x: i for i, x in enumerate(user_ids)}
user_encoded2user = {i: x for i, x in enumerate(user_ids)}

anime_ids = rating_df["anime_id"].unique().tolist()
anime2anime_encoded = {x: i for i, x in enumerate(anime_ids)}
anime_encoded2anime = {i: x for i, x in enumerate(anime_ids)}

rating_df = rating_df[rating_df["user_id"].isin(user2user_encoded)]
rating_df = rating_df[rating_df["anime_id"].isin(anime2anime_encoded)]

rating_df["user"] = rating_df["user_id"].map(lambda x: user2user_encoded.get(x, 0))
rating_df["anime"] = rating_df["anime_id"].map(lambda x: anime2anime_encoded.get(x, 0))

rating_df = rating_df.sample(frac=1, random_state=73)
train_indices = rating_df.shape[0] - test_set_size 

X_test = rating_df[['user', 'anime']].values[train_indices:]
y_test = rating_df["rating"].values[train_indices:]

X_test_array = [X_test[:, 0], X_test[:, 1]]

MODEL_PATH = './saved_model/my_model.h5'
model = tf.keras.models.load_model(MODEL_PATH)

def evaluate_model(model, X_test, y_test):
    """
    Evaluates the trained model on the test set and prints key performance metrics.

    Parameters:
        model: Loaded Keras model
        X_test: List of test input arrays [users, animes]
        y_test: Actual ratings in the test set
    """
    y_pred = model.predict(X_test)
    
    mae = mean_absolute_error(y_test, y_pred)
    mse = mean_squared_error(y_test, y_pred)
    rmse = np.sqrt(mse)
    r2 = r2_score(y_test, y_pred)
    
    print(f"Mean Absolute Error (MAE): {mae:.4f}")
    print(f"Mean Squared Error (MSE): {mse:.4f}")
    print(f"Root Mean Squared Error (RMSE): {rmse:.4f}")
    print(f"R² Score: {r2:.4f}")

    return {"MAE": mae, "MSE": mse, "RMSE": rmse, "R2": r2}

metrics = evaluate_model(model, X_test_array, y_test)
print(metrics)
