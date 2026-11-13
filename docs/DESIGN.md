# Desert Pixel RPG — fondasi desain

Status: hasil kesepakatan diskusi sebelum implementasi. **Dokumen ini adalah rencana game lengkap, bukan daftar fitur yang sudah selesai.** Prototipe pertama dibatasi pada gerak dan combat petarung. Rincian implementasi sementara ditandai terpisah di bawah.

## Identitas dan perangkat

- Android, solo offline, dikelola dan diuji pengguna dari HP saja.
- HP pengujian: Tecno Spark 20C, kapasitas penyimpanan 128 GB. RAM dan ruang kosong belum diketahui.
- Nama sementara: Desert Pixel RPG; nama final belum ditentukan.
- Pixel RPG retro seperti arah referensi, aset orisinal. Top-down dipakai pada prototipe; ukuran sprite final belum dikunci.
- Landscape. UI batu pasir dan emas kusam. Logo kelak berupa tulisan + simbol fantasi; logo produksi belum dibuat.
- Indonesia + Inggris. Musik chiptune. Batas FPS dapat dipilih 30/60; bukan jaminan performa.

## Dunia

Fantasi penuh beridentitas gurun dan oasis, dengan hutan serta bioma lain yang penempatannya masuk akal. Dunia tetap yang dirancang khusus, bukan procedural random per permainan. Bebas dijelajahi sejak awal; bahaya adalah pembatas alami, bukan gerbang level wajib. Jalan kaki dan tunggangan, tanpa fast travel pada konsep saat ini.

Memulai cerita sebagai pendatang di kota oasis, membawa bekal sederhana. Tutorial menunjukkan fungsi antarmuka saat pertama bermain, bertahap agar tidak memenuhi layar.

## Karakter dan combat

- Nama dan kustomisasi dasar: tampilan tubuh, kulit, rambut/warna rambut, pakaian awal. Penampilan tidak menentukan statistik.
- Class dipilih sejak awal: petarung, pemanah, penyihir.
- Sihir utama khusus jalur penyihir. Belum menetapkan sistem ganti class.
- Progres level + kemahiran kegiatan + equipment, masing-masing memiliki fungsi.
- Joystick + tombol aksi, serangan manual sesuai arah hadap, dua skill aktif dan menghindar.
- Custom HUD: posisi dan ukuran, dengan reset. Bukan editor seluruh layout menu.
- Status: HP dan stamina; mana khusus penyihir. **Lapar dibatalkan** dalam keputusan akhir. Haus, suhu, tidur, penyakit dan cedera bukan sistem wajib.
- Pemulihan HP melalui makanan/potion dan istirahat di rumah/penginapan, bukan regenerasi otomatis dalam perjalanan.
- Kalah: kembali ke tempat aman, equipment kehilangan ketahanan **hanya karena kalah**, bukan pemakaian biasa. Isi tas/koin tetap aman. Perbaikan berbayar melalui NPC.
- Detail besar penalti, biaya, damage, cooldown, dan ketahanan nol masih perlu balancing. Prototipe: -15 ketahanan saat kalah; equipment nol tetap ada tetapi damage menurun.

## Inventory, kerajinan, rumah

- Tas berbasis slot, bukan berat. Barang sejenis dapat ditumpuk; batas detail belum dikunci.
- Beberapa jenis tas, didapat lewat crafting/beli dan bisa di-upgrade.
- Equipment ringkas: senjata, armor satu set, aksesori.
- Stasiun crafting + jasa NPC sebagai alternatif.
- Aktivitas dasar tersedia untuk semua class; kerajinan tertentu eksklusif: petarung equipment khusus, pemanah amunisi/perangkap khusus, penyihir enchantment/item magis. Daftar resep detail belum dibuat.
- Rumah dibeli di lokasi tertentu, di-upgrade, diberi furnitur. Tidak membangun bebas per dinding.
- Peti lokal di rumah/camp, tidak terhubung antarlokasi. Mekanisme camp portabel belum dipilih.

## Cerita, NPC, quest

Cerita utama dan cerita per wilayah. Quest tersembunyi terpicu tindakan pemain dan hubungan NPC; kondisi spesifik perlu dirancang. Hubungan tidak ditampilkan dalam angka/bar, tetapi melalui dialog/sikap. Konsekuensi pilihan ringan, tidak menutup sebagian besar konten.

Panel quest ada di layar, bisa digeser/diciutkan ke pinggir dan dibuka kembali. Minimap dan peta besar tersedia. Quest yang sudah ditemukan memiliki penanda tujuan jelas; rahasia yang belum ditemukan tidak dibocorkan. Rencana peta mengungkap wilayah saat eksplorasi; fog-of-war belum termasuk prototipe.

## Ekonomi, event, menu

- Ekonomi seimbang: bekal terjangkau, rumah/tunggangan/equipment bagus memerlukan usaha.
- Pedagang di dunia + shop menu, menggunakan uang hasil bermain, bukan uang asli.
- Shop menu menjual kosmetik dan bekal dasar; pembelian bekal hanya di permukiman/rumah. Belum memutuskan akses kosmetik di luar zona aman.
- Event berupa festival menurut kalender **dalam game**, bukan jam/tanggal HP. Tidak membutuhkan server.
- Menu utama sederhana, bukan lobby multiplayer atau camp interaktif.
- Profil: identitas, statistik, pencapaian, serta koleksi penemuan. Tidak membocorkan rahasia yang belum ditemukan.

## Waktu, penyimpanan dan keamanan

Satu petualangan. Game baru mengganti petualangan lama setelah konfirmasi. Autosave saja, dengan cadangan otomatis lokal; tidak ada cloud atau ekspor/impor pada keputusan sekarang. Cadangan lokal tidak melindungi dari penghapusan data, reinstall, atau kerusakan HP.

Dunia dijeda ketika tas/shop/jurnal lengkap/menu jeda terbuka, mengatur HUD, atau aplikasi ditinggalkan. Panel quest kecil tidak menjeda dunia. Tidak ada kebutuhan progres realtime offline.

Tidak perlu server game/API key untuk fondasi ini. Signing key Android berbeda dari API key. Distribusi rilis berkelanjutan memerlukan key tetap, bukan debug key sekali pakai. Tidak ada kredensial yang disimpan di repo.

## Milestone pertama dan batasnya

**Dipilih pengguna:** area kecil, satu class petarung, tes gerak dan combat. Arah kendali/kenyamanan di HP didahulukan sebelum dunia besar.

Implementasi 0.1 menambahkan satu quest latihan, NPC perbaikan, potion/shop aman, minimap, HUD kustom, autosave dan menu sebagai sarana menguji loop combat. Nama Oasis Nara, NPC Rafi, scorpion, skill Tebas/Tangkis, harga, damage, palet/sprite, dan layout merupakan usulan implementasi yang dapat direvisi. Bukan keputusan konten final hasil diskusi.

Kustomisasi saat ini mencakup nama dan palet kulit/rambut/pakaian, belum variasi tubuh. Level tetap 1. Tas memakai daftar slot sederhana, belum manajemen inventory penuh. Seluruh peta latihan tampak di minimap, belum fog-of-war. Musuh latihan respawn setelah jeda ketika pemain jauh; posisi/HP musuh belum masuk save. Save menyimpan progres karakter, kill, hadiah, item, posisi dan waktu bermain.

## Tahap berikutnya (belum dijalankan)

1. Tes kontrol, ukuran HUD, performa 30/60 dan lifecycle pada Tecno Spark 20C.
2. Perbaiki hasil tes sebelum memperluas dunia.
3. Fondasi inventory/equipment/data item, kemahiran, dua class lainnya.
4. Dunia/quest/cerita, NPC dan kondisi quest tersembunyi.
5. Crafting, rumah, peti, tunggangan, kalender/festival dan kosmetik.
6. Finalisasi nama/logo/visual/audio, balancing, ketahanan save, signing dan distribusi.

Tidak ada tanggal rilis atau klaim selesai untuk seluruh rencana ini.
