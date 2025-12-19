# GitHub Actions Workflows

## Deploy to GitHub Pages

### Overview
Automatically builds and deploys the WordGym Students application to GitHub Pages when code is merged to the `main` branch.

### Workflow File
`.github/workflows/deploy.yml`

### Triggers
- **Automatic**: Push to `main` branch
- **Manual**: Workflow dispatch (can be triggered manually from GitHub Actions tab)

### Build Process
1. Checkout code from repository
2. Setup Node.js v20 with npm caching
3. Install dependencies using `npm ci`
4. Build project using `npm run build`
   - TypeScript compilation
   - Vite build with single-file plugin
   - Output: `dist/index.html` (250KB self-contained HTML)
5. Upload build artifacts to GitHub Pages
6. Deploy to GitHub Pages

### Deployment Target
- **Branch**: `gh-pages` (managed automatically by GitHub Pages)
- **URL**: https://youngger9765.github.io/WordGym-students-merge/
- **Base Path**: `/WordGym-students-merge/` (configured in `vite.config.ts`)

### Configuration

#### Vite Base Path
The `vite.config.ts` includes:
```typescript
base: '/WordGym-students-merge/'
```

This ensures all asset paths work correctly when deployed to a GitHub Pages subdirectory.

### Manual Deployment

To manually trigger deployment:
1. Go to GitHub repository
2. Click "Actions" tab
3. Select "Deploy to GitHub Pages" workflow
4. Click "Run workflow" dropdown
5. Select `main` branch
6. Click "Run workflow" button

### Permissions
The workflow requires:
- `contents: read` - Read repository code
- `pages: write` - Write to GitHub Pages
- `id-token: write` - Deploy to GitHub Pages (OIDC)

### Troubleshooting

#### Build Fails
1. Check Node.js version compatibility (workflow uses v20)
2. Verify `npm ci` succeeds (check package-lock.json is committed)
3. Check TypeScript errors: `npm run build` locally
4. Review workflow logs in GitHub Actions tab

#### Deployment Fails
1. Verify GitHub Pages is enabled in repository settings
2. Check Pages is set to deploy from "GitHub Actions" source
3. Verify workflow has correct permissions
4. Check concurrency settings (only one deployment at a time)

#### Site Not Loading
1. Verify base path in `vite.config.ts` matches repository name
2. Check browser console for 404 errors on assets
3. Verify `dist/index.html` contains inline CSS/JS (single-file build)
4. Clear browser cache and retry

#### Enable GitHub Pages

If this is the first deployment, enable GitHub Pages:
1. Go to repository Settings
2. Navigate to "Pages" section
3. Under "Build and deployment":
   - Source: "GitHub Actions"
4. Save settings
5. Trigger workflow (push to main or manual dispatch)
6. Wait 1-2 minutes for deployment
7. Visit: https://youngger9765.github.io/WordGym-students-merge/

### Local Testing

Test the build locally before pushing:
```bash
# Build the project
npm run build

# Verify output
ls -lh dist/
# Should show index.html (~250KB)

# Preview locally (note: base path won't match)
npm run preview
```

### Concurrency Control
The workflow uses concurrency control to prevent multiple simultaneous deployments:
- Group: `pages`
- Cancel in progress: `false` (queues deployments, doesn't cancel)

This ensures deployments complete in order without conflicts.

### Workflow Status
Check deployment status:
- GitHub Actions tab shows workflow runs
- Green checkmark = successful deployment
- Red X = failed deployment (click for logs)
- Yellow dot = in progress

### Best Practices
1. Always test `npm run build` locally before merging to main
2. Use pull requests to review changes before triggering deployment
3. Monitor workflow runs for errors
4. Keep dependencies updated (npm audit)
5. Verify deployment by visiting the live URL

### Next Steps After Setup
1. Enable GitHub Pages in repository settings (see above)
2. Merge workflow file to main branch
3. Verify first deployment succeeds
4. Bookmark deployment URL
5. Configure custom domain (optional)

---

**Note**: The single HTML file output (250KB) means the entire application is self-contained. No external assets are loaded, making deployment simple and reliable.
