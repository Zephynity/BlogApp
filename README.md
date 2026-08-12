# Blog Application API - Documentation

### Features

- User registration
- User login using email or username
- Password hashing using bcrypt
- JWT-based authentication
- Create blog posts
- View all blog posts
- View a single blog post
- Update own blog posts
- Delete own blog posts
- Admin users can delete any blog post
- Add comments to blog posts
- Error handling and appropriate HTTP responses

---

## Resources

- App Base URL

    - `http://localhost:4000`

- Admin User

    - Email: "admin@mail.com"
    - Username: "AdminUser"
    - Password: "admin1234"

> The Admin account can delete any blog post.

---

## References

## Endpoints

### Users

#### [POST] - "/users/login"

> Users can login using email/username.

- Sample Request Body

    ```json

    {
        "login": "john@mail.com",
        "password": "john1234"
    }

    ```

#### [POST] - "/users/register"

- Sample Request Body

    ```json

    {
        "email": "john@mail.com",
        "username": "johnD",
        "password": "john1234"
    }

    ```

### Posts

#### [GET] - "/posts"

- Retrieves all available blog posts.

- No Request Body

#### [GET] - "/posts/getPost/:id"

- Retrieves a specific blog post.

- No Request Body

#### [POST] - "/posts/createPost"

- Creates a new blog post.

- Sample Request Body

    ```json

    {
        "title": "Blog Post",
        "content": "This is a blog post."
    }

    ```

#### [PATCH] - "/posts/updatePost/:id"

- Updates an existing blog post.

- Sample Request Body

    ```json

    {
        "title": "Updated Blog Post",
        "content": "This is the updated blog post."
    }

    ```

#### [DELETE] - "/posts/deletePost/:id"

- Deletes an existing blog post.

- No Request Body

#### [POST] - "/posts/addComment/:id"

- Adds a comment to a blog post.

- Sample Request Body

    ```json

    {
        "comment": "This is a great blog post!"
    }

    ```