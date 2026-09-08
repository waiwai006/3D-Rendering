# Image loading fix — v2.2

Reproduced Taikoo search returning images on hkcdn.centanet.com. Direct image
request returned HTTP 200 image/png (30,692 bytes), but the local proxy returned
403 because only hk.centanet.com was allowed. Added the exact Centaline CDN and
floor-plan hosts to the allowlist. Unrelated hosts remain blocked.

Search IDs previously truncated the first 18 characters of base64-encoded URLs:
the common URL prefix made multiple cards share an ID. IDs now hash the full
source URL and image index.

Validation: 22 tests passed, including three permitted Centaline hosts and an
unrelated-host rejection. Production build passed with existing Auth0 warnings.
Local browser UAT searched Taikoo, confirmed the first current listing image,
cropped it, and reached Review layout with a decoded 536 × 338 preview.

GitHub Pages remains static and uses bundled floor plans; the proxy fix runs
locally and on server-capable deployments only.
