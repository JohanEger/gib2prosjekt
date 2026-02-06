## Working with the client locally

### Installation

Run the following command to install all dependencies that are used.

```powershell
npm i
```

You should also configure Prettier to ensure that the formatting is correct in the frontend. This makes the code a lot
easier to read.

#### Running the code

```powershell
npm run dev
```

### Managing environment variables

You can modify the environment variables for the client. It is possible, with a minor change, to use the API running on
the server. One clear benefit of this is that you do not need the backend/server running locally on your computer, but
you have to be connected to a NTNU network. This is often useful if you are a frontend developer that does not want
to worry about running the backend locally. To do so simply change the contents of the `client/.env` to

```dotenv
VITE_BACKEND_BASE_URL=http://tba4250s0x:5000
```

where `x` is the group number. This requires a restart of the code.