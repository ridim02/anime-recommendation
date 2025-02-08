import tensorflow as tf
from tensorflow.python.keras.layers import Input, Embedding, Flatten, Dot, Dense
from tensorflow.python.keras.models import Model

def RecommenderNet():
    embedding_size = 128

    user = Input(name='user', shape=[1])
    user_embedding = Embedding(name='user_embedding', input_dim=10000, output_dim=embedding_size)(user)
    user_vec = Flatten()(user_embedding)

    anime = Input(name='anime', shape=[1])
    anime_embedding = Embedding(name='anime_embedding', input_dim=10000, output_dim=embedding_size)(anime)
    anime_vec = Flatten()(anime_embedding)

    prod = Dot(name='dot_product', axes=1)([user_vec, anime_vec])
    model = Model(inputs=[user, anime], outputs=prod)
    model.compile(optimizer='adam', loss='mean_squared_error')
    return model