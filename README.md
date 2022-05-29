# Web Movie Database
## Description
Website ini berfungsi untuk menampilkan informasi singkat mengenai suatu film. Terdapat 2 user yang berupa admin dan regular user. Admin memiliki privilege untuk melakukan CRUD pada tabel film. Reguler user tak hanya dapat melihat informasi film tetapi juga dapat melakukan penilaian serta penandaan pakah film tersebut ingin ditonton (Planned to Watch) atau sudah ditonton (Completed). Nilai film akan dirata-ratakan dari semua penilaian reguler user yang ada.

## How to run
Terdapat beberapa dependency yang harus di install sebelumnya.
```
npm install alert bcrypt body-parser cookie-parser dotenv express express-session memorystore pg
```
Setelah semua terinstall baru bisa dijalankan.
```
node server.js
```
