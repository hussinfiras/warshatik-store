# warshaTik

Repository structure:

- `store/` — public website for `warshatik.org`
- `admin/` — admin dashboard for `admin.warshatik.org`

## Current state

The public store is a static HTML/CSS/JS version.

The admin dashboard currently saves product/course edits in the browser using LocalStorage. It already includes direct image selection and drag-to-reorder UI, but the images are still local to that browser. The next backend step is Cloudflare D1 + R2 so admin changes update the public store and product images upload to cloud storage.

## Cloudflare Pages

Create two Pages projects from this same repository:

1. Store project
   - Root directory: `store`
   - Custom domain: `warshatik.org`

2. Admin project
   - Root directory: `admin`
   - Custom domain: `admin.warshatik.org`

For the current static version, no build command is required.
