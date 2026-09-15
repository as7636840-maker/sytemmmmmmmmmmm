# Golden Streamers

## Running

- Angular: `npm run dev:client` — http://localhost:4200
- API: `npm run dev:server` — port 5000 (set `PORT=5000` in `server/.env`).
- On machines requiring Windows system certificate roots, run `node --use-system-ca server/src/index.js`.
- Existing database connection and login credentials are preserved. The database does not contain the old Golden Games name; changing its URI to an empty database would hide existing accounts and payroll records. New installation examples use `golden-streamers`.

## Tasks

Attendance & Work includes independent personal tasks, with text and/or a PNG/JPEG image (up to 3 MB), Pending/Completed status, editing and deletion by their creator. Admins can browse every user's tasks, but cannot create, edit or delete tasks, including their own historical tasks. Tasks do not require checking in. Lists are paginated.

To enable image uploads, add these values **locally** in `server/.env` and restart the API:

```dotenv
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

Uploads use the server-side signed [Cloudinary Upload API](https://cloudinary.com/documentation/upload_images); the secret never reaches the browser. Without credentials, text tasks work and image uploads show a configuration error. Removing a task/image removes its application reference; Cloudinary assets remain available for retention/cleanup through the provider.

## Management

The new `/management` page is below Game Tracker. ADMIN accounts have read-only access. Only MANAGEMENT accounts can create, resolve and reopen problems. Assign MANAGEMENT through Employees → Edit → Role. Problems are retained; transitions record actor/time. Age counts Cairo calendar days, freezes on resolution, and restarts when reopened. Open problems become red at 7 days. The page refreshes every minute. Existing management payroll is at `/management-payroll`.

## Game Tracker compatibility

The 14 requested columns are displayed in order. Existing `photoForPayment` is Customer Payment Proof; `photoFromUs` is Transfer Proof. `purchaseProof` is the new company Payment Proof. `paymentMethod` remains Our Payment Method, `price` remains Sold For internally. New fields are `customerPaymentMethod` and `transferredToCompany`. Legacy records show unspecified/not confirmed for new fields, with old photos preserved. The original admin-only edit/delete policy remains.

## Verification

`npm test --prefix server` covers existing workflows plus task ownership/validation, all-task admin visibility, management permissions, Cairo calendar ages, mocked Cloudinary upload failures and the new tracker fields. `npm run build --prefix client` compiles all Angular pages.
