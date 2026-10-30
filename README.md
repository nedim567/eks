# Still / Motion

A small, polished photo and video gallery built with Next.js. Add files to `public/media` and the site discovers them automatically. The gallery stays at two columns on both mobile and desktop. Photos and videos open in an on-page full-size viewer; videos start playing there. Media counts appear below the title, and more items load automatically as visitors scroll.

## Add your media

1. Copy image or video files into `public/media/`.
2. Supported formats: JPG, JPEG, PNG, WEBP, AVIF, GIF, MP4, WEBM, MOV, and M4V.
3. Use the original filenames to identify items when selecting pins in the config file.
4. Run the site locally with `npm install` and `npm run dev`, or deploy it to see the updated collection.

To choose the default pinned items shown first in the gallery for everyone, add their exact filenames to the `featured` array in `media.config.json`:

```json
{
  "title": "Maturalna Ekskurzija IV-4 2026",
  "subtitle": "",
  "featured": ["summer-evening.jpg", "first-dance.mp4"]
}
```

Change `title` and `subtitle` in the same file whenever you are ready to replace them. A non-empty subtitle appears below the title. Pinned items appear first in the same gallery without a special label; all other supported files are shuffled each time the page is opened.

Only the site owner can change which items are pinned: add or remove filenames in the `featured` array in `media.config.json`. The order is shared with every visitor after the change is deployed. Visitors do not see pin controls or a pinned label.

Click a photo or a video's play button to open it full size without leaving the page. Use the arrow keys or on-screen arrows to browse, and press Escape or click outside the media to close it.

## Run locally

Install Node.js 20 or later, then from the project folder:

```bash
npm install
npm run dev
```

Open the local address printed in the terminal. Adding or removing media requires a page refresh in development.

## Deploy to Vercel

1. Push this project to a GitHub, GitLab, or Bitbucket repository.
2. In Vercel, choose **Add New → Project** and import that repository.
3. Keep the detected Next.js framework and default build settings, then deploy.
4. Commit and push new media files and `media.config.json` changes to publish gallery updates.

Media placed in `public/media` is included in the deployment. For large collections or frequent uploads, use object storage (such as Vercel Blob) rather than committing large video files to Git.

## Discord visit and media-view notifications

Create a Discord webhook for the channel where notices should appear, then add its URL to the Vercel project as the server-only environment variable `DISCORD_WEBHOOK_URL`.

To keep view totals across deployments, connect an Upstash Redis database to the Vercel project and set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` in the project's environment variables. You can use the same names in a local `.env.local` file (see `.env.example`). Redeploy after adding or changing environment variables.

Every time a visitor opens a photo or video, Discord receives a separate notice with a distinct 🖼️ or 🎬 icon and overall photo/video/combined totals. Photos appear directly as image previews in Discord, without showing their filenames. Videos include a frame thumbnail generated from the video and a clickable title that opens the exact video. Opening another item with the viewer arrows is counted as another view. Page-load notices include approximate device, operating system, browser, and local time. The site does not send IP addresses or persistent visitor IDs; exact phone models are not always available from browsers.
