# Uploading Images

## Processing and Storing Files in the Cloud
Building on [prior explorations with CRUD](https://github.com/ixd-system-design/Managing-Data), this demo adds functionality for photo uploads. Uploaded image files are resized to fit a defined size, and then stored using [Vercel Blob Storage](https://vercel.com/docs/vercel-blob). This results in a public URL which in turn is saved to MongoDB as an ordinary string. 

## User Interface
The [default UI](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/input/file) for uploads (i.e. `<input type="file">`) has been hidden; instead we add a custom UI via input label. Drag-and-drop has been implemented, but only where this feature makes sense. Before enabling drag-and-drop we use [matchMedia](https://developer.mozilla.org/en-US/docs/Web/API/Window/matchMedia) with a `pointer: fine` media query to ensure the user actually has a mouse (i.e. NOT a tablet or phone)

## BusBoy - Upload Processing Library
On the backend, the [BusBoy](https://www.npmjs.com/package/busboy) library handles file uploads by parsing the relevant headers that the frontend creates (i.e. `multipart/form-data`).

## Sharp - Image Resizing Library
We use the [Sharp](https://sharp.pixelplumbing.com/) JavaScript library to scale down images to a predictable and performant size. This helps to prevent abuse of the system. 

## Setup Blob Storage 
Assuming you are using a copy of this template: Prior to local development, deploy your repo directly to Vercel, using an environment variable `DATABASE_URL` containing your MongoDB connection string (be sure to include a database name on the end of the string). After the initial Vercel deployment, we can setup the Blob Storage as follows:

1. Go to your project on the [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to the **Storage** tab
3. Click **Create Database** and select **Blob**
4. Follow the prompts to enable Blob storage for your project
5. Vercel will automatically generate a `BLOB_READ_WRITE_TOKEN` environment variable
6. For local development, copy this token from the **Environment Variables** section
7. Add it to your `.env` file: `BLOB_READ_WRITE_TOKEN=your_token_here`

The Blob storage is now ready to accept image uploads both in production (on Vercel) and locally.

# Local Develoment
- Add your MongoDB connection string to the `.env` file (see `.env.example` for an example).
- Be sure to include the name of the Database you want to connect to. For example, if your connection string is `mongodb+srv://username:password@cluster.abc.mongodb.net/MyDatabase`, you would change `MyDatabase` to any database name of your choosing.
- Add your Vercel Blob storage token string to the `.env` file (see above, and also see `.env.example` for an example).
- Run `npm install` to install [express](https://expressjs.com/) and [prisma](https://www.prisma.io/orm). NOTE: `prisma generate` runs automatically as a `postinstall` script (see `package.json` for details).  

## Learning Prompts
- Can you create a system map to describe the architecture of this web app?
- Having added an image upload capability, what new use cases emerge?

## Schema and Form Iteration
Reminder that in this demo, as with out [prior exploration](https://github.com/ixd-system-design/Managing-Data), it's possible to iterate on the prisma schema and form elements to accomplish new use cases. A typical iteration pattern here might be as follows:
1. create form elements that fit your concept, each with a given `name` (`index.html`)
2. add the new element to the display template (`script.js`) using its proper `name`.
3. add the corresponding `name` to `schema.prisma` with relevant a data type and save
4. re-generate the Prisma Client from the schema using `npx prisma generate`
5. re-start the app using `npm run start`
6. test that all CRUD operations work as expected (Create, Read, Update, Delete)
7. verify that data changes are reflected in MongoDB Compass.
