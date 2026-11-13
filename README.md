# Desert Pixel RPG

Prototipe **0.1 — gerak dan combat**, fondasi RPG pixel Android solo offline. Nama game, nama wilayah **Oasis Nara**, simbol logo, dan visual awal masih sementara.

## Yang sudah bisa dicoba

- Menu utama dengan dunia pixel bergerak, karakter petarung dan pilihan nama/warna kulit/rambut/pakaian.
- Satu oasis buatan tangan, collision bangunan/air, kalajengking yang mengejar di luar zona aman.
- Joystick multitouch, serangan sesuai arah hadap, Tebas, Tangkis, dan menghindar.
- HP + stamina (tanpa lapar), potion, kekalahan dengan penalti ketahanan equipment, perbaikan melalui NPC.
- Quest latihan tiga kalajengking, hadiah satu kali, panel quest yang bisa diciutkan/digeser.
- Minimap, peta wilayah latihan, tas sederhana, profil dan catatan penemuan awal.
- Toko potion yang hanya melayani pembelian di area aman, istirahat berbayar melalui penjaga oasis.
- Pengaturan Indonesia/Inggris, batas 30/60 FPS, suara/musik chiptune, posisi dan ukuran kontrol.
- Satu slot petualangan, autosave setiap lima detik aktif dan pada transaksi/background, cadangan lokal sebelumnya serta pemulihan jika save utama rusak.
- Pause ketika membuka menu, aplikasi kehilangan fokus, atau sedang mengatur HUD.
- Android wrapper landscape, tombol Back membuka pause, web assets dibundel untuk permainan offline.

**Belum tersedia:** dunia besar, class pemanah/penyihir, progres level, mana, quest cerita/rahasia, crafting, rumah/peti, tunggangan, festival, kosmetik, upgrade tas, variasi tubuh, dan peta fog-of-war. Bangunan selain bengkel merupakan dekorasi, bukan interior yang bisa dimasuki. Angka combat/harga merupakan nilai pengujian, bukan balancing final. Tidak ada iklan, akun, pembayaran, API key, atau server gameplay.

## Coba di HP

Buka **Live Preview** Arena, putar HP mendatar, lalu tekan **Mulai Petualangan**. Buat karakter dan ikuti tiga petunjuk awal. Gunakan joystick kiri dan tombol di kanan. Tujuan pertama: kalahkan tiga kalajengking di tenggara, lalu kembali ke Rafi di sebelah bengkel barat (penanda emas pada peta).

Live Preview adalah alat pengujian browser, **bukan APK**. Server preview development membutuhkan koneksi. Build web produksi dapat dibuka offline setelah service worker selesai menyimpan aset pada kunjungan pertama; APK membundel aset langsung tanpa kunjungan awal.

## Pengembangan

Node.js 22 direkomendasikan.

```sh
npm ci
npm run dev            # 0.0.0.0:5173; host preview diizinkan
npm test               # pengujian logika
npm run build          # produksi + cache offline ber-versi
npm run preview        # preview build produksi
```

Pengujian browser:

```sh
npx playwright install --with-deps chromium
npm run test:e2e
npm run build && npm run test:offline   # cache produksi + simulasi tanpa internet
```

Untuk Chromium yang sudah tersedia, gunakan `CHROMIUM_PATH=/path/to/chromium npm run test:e2e`. Pengujian browser memeriksa onboarding, gerak/save, menu, potion, combat, NPC, quest, pembelian aman, konfigurasi HUD, dan pemulihan save.

### Kontrol komputer

| Tombol | Aksi |
| --- | --- |
| WASD / panah | Gerak |
| J | Serang (bisa ditahan) |
| K / L | Tebas / Tangkis |
| Space | Menghindar |
| E | Bicara dengan NPC terdekat |
| Q | Potion |
| I / M | Tas / peta |
| Escape | Jeda / tutup menu |

## APK Android dari HP melalui GitHub Actions

Workflow `.github/workflows/android.yml` sudah disiapkan. **Menambahkan workflow belum berarti APK sudah berhasil dibangun.** Setelah perubahan tersedia di GitHub pada branch kerja:

1. Buka tab **Actions** pada repo melalui browser HP.
2. Pilih **Build Android debug APK → Run workflow** dan branch kerja ini.
3. Tunggu berhasil, lalu unduh artifact **desert-pixel-rpg-debug**.
4. Ekstrak ZIP dan instal `app-debug.apk`. Izinkan pemasangan dari sumber tersebut hanya jika kamu mempercayai build-nya.

Workflow memakai Node 22, Java 21, Android SDK, unit test, web build, Capacitor sync, dan Gradle `assembleDebug`. Tidak membutuhkan signing secret untuk **debug build**. Kuota Actions mengikuti akun GitHub. Build lokal membutuhkan Android SDK 35 dan Java 21:

```sh
npm run android:sync
cd android
./gradlew assembleDebug
```

Output: `android/app/build/outputs/apk/debug/app-debug.apk`.

**Status verifikasi:** web build, unit test dan pengujian browser dijalankan di lingkungan pengembangan. Native Android/APK belum diverifikasi pada perangkat. Tidak ada Android SDK lengkap di lingkungan ini; build APK perlu dilakukan melalui Actions atau mesin dengan SDK.

**Penting:** debug key runner dapat berbeda antar-build, sehingga APK debug berikutnya mungkin tidak dapat dipasang sebagai update. Jangan hapus instalasi yang berisi progres penting untuk memaksakan update. Distribusi berkelanjutan memerlukan signing key tetap yang dikelola aman; ini belum disiapkan. Jangan memasukkan keystore/password ke Git.

## Save dan privasi

Save disimpan lokal dengan skema versi 1. Backup adalah salinan save valid sebelumnya, **bukan cloud save dan bukan slot petualangan kedua**. Menghapus data browser/aplikasi, kehilangan HP, atau reinstall dapat menghapus keduanya. Backup OS Android dinonaktifkan agar tidak menjanjikan cloud backup yang tidak dipilih. Tidak ada ekspor/impor pada versi ini. Save dari preview browser tidak otomatis pindah ke APK.

## Struktur

- `src/main.js` — lifecycle, input, UI, combat, NPC, audio dan integrasi save.
- `src/render.js` — dunia/sprite pixel orisinal yang digambar dengan Canvas, collision, minimap.
- `src/core.js` — logika murni dan validasi/pemulihan save.
- `src/style.css`, `src/ui.css` — menu dan kontrol responsif.
- `android/` — proyek Capacitor native (aset hasil build tidak masuk Git).
- `docs/DESIGN.md` — keputusan dari diskusi, dibedakan dari cakupan prototipe.

Visual digambar secara prosedural dalam kode; audio sintetis melalui Web Audio. Tidak ada aset yang disalin dari game referensi dan tidak ada dependensi font/gambar/audio eksternal ketika bermain. Canvas 2D + Vite dipilih untuk memungkinkan preview HP segera; Capacitor membungkus build yang sama untuk Android. Keputusan ini bisa dievaluasi ulang sebelum skala dunia membesar.
