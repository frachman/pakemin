# Task Authority Boundary Note v0

## 1. Status, tujuan, dan baseline sumber

- Status: **Proposed decision** untuk review owner; bukan ADR dan bukan kontrak normatif.
- Tujuan: menetapkan batas klaim dan semantik minimum authority satu task sebelum owner memutuskan apakah pekerjaan boleh maju ke ADR.
- Target konseptual: kandidat v0.3.0; scope rilis belum disetujui.
- Baseline checkout: remote `origin` adalah `git@github.com:frachman/pakemin.git`; branch kerja `v0.3.0` dibuat dari `master` pada commit `28e0259ed6342858e31201be2eb84f4f6038fd54`; tag yang tersedia saat inspeksi mencakup `v0.2.0`, `v0.1.2`, `v0.1.1`, dan `v0.1.0`. Referensi commit memo ini adalah `28e0259`.
- Batas bukti: ini adalah pembacaan checkout lokal, bukan audit remote atau rilis. Tidak ditemukan dokumen/patch pekerjaan 01 v0.2.1 di `.orca/drops`; status pekerjaan tersebut belum terverifikasi dan tidak direkonstruksi.

Memo ini memakai tiga label. **Locked invariant** berasal dari brief atau keputusan yang telah diterima; label ini tidak menyiratkan semuanya telah diimplementasikan. **Proposed decision** adalah rekomendasi untuk owner. **Deferred implementation detail** menandai perkara untuk ADR/kontrak/schema atau tahap implementasi berikutnya.

## 2. Masalah produk dan contoh sederhana

**Locked invariant — konteks brief, belum seluruhnya normatif/eksekusi.** Governance repository dapat mengizinkan perubahan ke sejumlah area. Jika owner memberi tugas hanya untuk halaman showroom ODEC, perubahan Vindue tetap dapat lolos pemeriksaan repository tetapi melampaui tugas itu. Pemeriksaan task harus mengikat perubahan yang dinilai ke authority yang diberikan untuk task tertentu.

**Proposed decision.** Pakemin menilai apakah fakta perubahan Git yang diamati sesuai dengan authority task yang terikat dan governance efektif. Contoh path di memo ini bersifat fiktif; bukan struktur aktual repository mana pun.

## 3. Istilah serta batas klaim

| Istilah | Makna dalam memo |
| --- | --- |
| Repository compliance | Hasil evaluasi change set terhadap governance repository dan scope turunannya. |
| Task compliance | Klaim terbatas bahwa change set yang diperiksa berada dalam authority task yang terikat serta memenuhi rule efektif yang berlaku. |
| Task Envelope | Catatan authority konseptual untuk satu task; bukan prompt, task manager, atau bukti kebenaran bisnis. |
| Provenance | Asal authority/rule dan rantai yang menghubungkannya ke layer, dokumen, scope, dan pemberi. |
| Integrity reference | Referensi yang memungkinkan perubahan pada baseline, authority, atau governance terikat terdeteksi. |
| Trust | Alasan untuk menerima pemberi atau proses pemberian authority sebagai berwenang. Nama orang atau hash saja tidak cukup. |

**Locked invariant — Verification Contract v0, “Normative Language and Mode” dan “Conformance”; ADR-0014, “Decision” (commit `28e0259`).** Tanpa envelope, repository check tetap dapat berjalan, tetapi tidak boleh mengklaim task compliance. Repository pass tidak menyatakan task pass.

**Proposed decision.** Klaim task compliance hanya boleh dibuat untuk repository, baseline, authority, effective rules, dan change set yang sesuai binding tepercaya dan benar-benar dievaluasi. Klaim ini tidak membuktikan bahwa implementasi benar secara semantik, tujuan bisnis tercapai, seluruh test relevan, atau seluruh tindakan agent selama eksekusi tercatat. Pemeriksaan diff bukan sandbox dan tidak membuktikan agent tak pernah melakukan tindakan di luar repository.

## 4. Locked invariants dan evidence map

| Klaim/invariant | Kategori | Sumber pada commit `28e0259` | Status bukti |
| --- | --- | --- | --- |
| Pakemin vendor-neutral, bukan agent runtime; tiga pilar Right Context, Clear Authority, Verifiable Changes | Locked invariant (diterima) | `docs/adr/0008-governance-positioning.md`, “Decision”; `README.md`, pembuka | Normatif dan positioning; bukan pengukuran implementasi. |
| Hierarki Defaults → Organization opsional → Repository → Scope → Task; scope dipilih path; nested scope single-parent; policy tetap/lebih restriktif; provenance dipertahankan | Locked invariant (ADR-0009) | `docs/adr/0009-layered-authority.md`, “Decision” | Normatif untuk authority proyek; resolver task belum ada. |
| Governance repository harus terbaca dari berkas repository; governance tetap berguna tanpa Organization; lockfile ditunda | Locked invariant (ADR-0012) | `docs/adr/0012-governance-source-boundaries.md`, “Decision” | Normatif; ADR tidak mendefinisikan envelope. |
| Schema governance deterministik, path-based, typed; rule efektif membawa sumber; task envelope dan implementasi tidak didefinisikan ADR | Locked invariant (ADR-0013) | `docs/adr/0013-declarative-governance-schema.md`, “Decision” dan “Non-Decisions” | Normatif; Governance Schema v0 menyediakan perilaku repository yang executable. |
| Tanpa task declaration hanya repository compliance; task authority tidak boleh melebihi governance; baseline/change set dan hasil memiliki batas yang diterima | Locked invariant (ADR-0014) | `docs/adr/0014-least-change-verification.md`, “Decision” | Keputusan arsitektur accepted; belum menyelesaikan detail envelope. |
| Contract v0 hanya mode repository, field report tertutup, hasil governance `pass`/`fail`/`requires-review`; invalid/runtime error terpisah | Locked invariant (kontrak accepted) | `docs/architecture/verification-contract-v0.md`, “Normative Language and Mode”, “Outcome and Exit Codes”, “Process Diagnostics” | Normatif; implementasi `pakemin check` ada. Tidak boleh diam-diam diubah oleh memo ini. |
| Change set berisi added/modified/deleted/renamed; rename memiliki sisi source dan destination; rule allowed/forbidden/required/review dievaluasi deterministik | Locked invariant (kontrak/schema v0) | `docs/architecture/verification-contract-v0.md`, “Normalized Inputs”, “Rule Evaluation”; `docs/reference/governance-schema-v0.md`, “Rule Types” | Kontrak normatif dan test conformance tersedia. |
| Check melakukan repository verification dan selalu melaporkan `verificationMode: repository` | Implemented behavior, bukan task decision | `docs/reference/cli.md`, `pakemin check`; `src/verification/evaluate.js`, report construction; `test/pakemin-check.test.js` | Implementasi dan test ditemukan di checkout; task behavior tidak ada. |
| Status pekerjaan v0.2.1/patch nomor 01 | Belum terverifikasi | Tidak ada drop/patch nomor 01 yang ditemukan di `.orca/drops`; roadmap menjelaskan milestone v0.2.0 | Jangan menyimpulkan selesai/belum dari sumber yang tidak tersedia. |

Kategori arsitektur relevan adalah **Architecture** dan **Architecture decision records** menurut `docs/README.md`. Memo ini artefak review internal `.orca/drops`, bukan dokumen kategori publik; tidak mengubah README navigasi.

## 5. Proposed decisions untuk lima pertanyaan inti

### 5.1 Tanpa Task Envelope

**Locked invariant.** Repository verification tetap boleh menghasilkan hasil repository; task compliance tidak boleh diklaim. Sumber: ADR-0014, “Decision”; Verification Contract v0, “Normative Language and Mode” (commit `28e0259`).

**Proposed decision.** Nyatakan eksplisit “task compliance cannot be claimed” di konseptual hasil task-aware bila envelope tidak tersedia atau binding-nya tidak memadai. Jangan memetakan ketiadaan envelope menjadi repository `fail`; jangan tampilkan sebagai task pass.

### 5.2 Mempersempit authority parent dan konflik batas

**Locked invariant.** Child tidak boleh melemahkan parent; policy hanya tetap atau semakin restriktif. Semua rule parent yang applicable tetap berlaku. Sumber: ADR-0009, “Decision”; Governance Schema v0, aturan `allowed-paths` (commit `28e0259`).

**Proposed decision.** Untuk setiap path, authority task adalah irisan batas task dengan authority inherited yang berlaku. Pemilihan path tidak menghapus kewajiban rule parent. Jika parent mensyaratkan perubahan test di luar path yang diizinkan task, laporkan konflik authority; jangan otomatis mengubah envelope atau melewati rule. Minta owner memperluas task secara eksplisit atau memecah pekerjaan/mengubah rancangan.

### 5.3 Authority minimum yang perlu diikat

**Proposed decision.** Secara semantik, binding minimum mencakup: identitas task yang stabil; identitas repository/root; baseline; batas perubahan; effective rules yang berlaku; provenance authority; referensi integritas untuk authority dan governance; serta identitas change set yang diverifikasi. Ini cukup mengaitkan evaluasi dengan satu pemberian authority tanpa menjadikan Pakemin task-management system.

**Deferred implementation detail.** Field final, encoding, canonicalization, perubahan Git yang dianggap subject, dan format manifest ditentukan setelah owner menerima ADR dan kontrak.

### 5.4 Provenance, trust, integrity

**Locked invariant.** Provenance effective rules harus dipertahankan; exception eksplisit, sempit, attributable, auditable. Sumber: ADR-0009, “Decision”; ADR-0013, “Decision” (commit `28e0259`).

**Proposed decision.** Bukti audit harus menjawab: authority berasal dari layer/dokumen/scope mana; siapa atau proses apa yang memberikannya; mengapa pemberi/proses itu dipercaya dalam konteks repository; dan apakah authority, baseline, serta governance berubah sejak pemberian. `approvedBy` hanyalah atribusi yang tercatat, bukan bukti trust. Hash dapat mendeteksi perubahan hanya jika nilai acuannya berasal dari binding yang dipercaya; hash sendiri tidak mengautentikasi approver.

**Deferred implementation detail.** Tunda signature, identity provider, algoritma hash, canonicalization, penyimpanan, masa berlaku/revocation, dan transport CI. ADR-0014 secara eksplisit belum mengklaim cryptographic attestation atau signer identity.

### 5.5 Pelanggaran, review, invalid, dan klaim tak tersedia

**Locked invariant.** Contract v0 memisahkan state rule `satisfied`/`violated`/`indeterminate`, outcome `pass`/`fail`/`requires-review`, dan kegagalan proses exit 3/4. `fail` mendominasi `requires-review`; review bukan pass. Sumber: Verification Contract v0, “Rule Evaluation”, “Outcome and Exit Codes”, “Process Diagnostics” (commit `28e0259`).

**Proposed decision.** Pertahankan klasifikasi repository yang ada. Pada layer konseptual task: pelanggaran batas/rule yang dapat dibuktikan adalah task violation; ketidakpastian yang memang memerlukan keputusan manusia dapat meminta review; envelope/binding tidak ada atau tidak dipercaya berarti task compliance tidak dapat diklaim; input task yang malformed atau evaluasi yang gagal adalah error proses, bukan pelanggaran governance. Permintaan review tidak memberi authority baru. Jangan mengubah enum, reason code, precedence, JSON, atau exit code kontrak v0 dalam memo ini. Jika task outcome membutuhkan kategori tambahan, usulkan untuk kontrak berikutnya.

## 6. Minimum authority semantics dan batas trust

| Unsur | Tujuan dan risiko bila tidak terikat | Rekomendasi |
| --- | --- | --- |
| Task identity | Mencegah hasil tersambung ke tugas yang salah; tanpa ini klaim tidak punya unit kerja yang jelas. | **Proposed decision:** identitas stabil dan ringkas; bukan lifecycle task manager. |
| Repository identity | Mencegah authority repo A dipakai di repo B. | **Proposed decision:** ikat ke identitas/root repository dan validasi sebelum evaluasi. Bentuk identitas ditunda. |
| Baseline | Menentukan keadaan awal authority dan perbandingan; baseline salah membuat diff/klaim tidak relevan. | **Locked invariant:** comparison harus eksplisit dan tidak diam-diam diinferensikan (Contract v0, “Comparison”). **Proposed decision:** envelope baseline harus cocok dengan basis evaluasi; mismatch menggagalkan klaim task. |
| Filesystem boundaries | Mengidentifikasi area perubahan yang diizinkan; batas longgar memungkinkan kerja lintas task. | **Proposed decision:** task hanya mempersempit inherited authority per path; gunakan semantik path governance. Rename dinilai pada source dan destination menurut Contract v0. |
| Effective rules | Mencegah task memilih hanya aturan yang menguntungkan atau menghilangkan kewajiban parent. | **Locked invariant:** rule berlaku sesuai scope chain dan provenance. **Proposed decision:** evaluasi semua rule efektif, bukan daftar pilihan task yang dapat menghapus parent. |
| Authority provenance | Menjelaskan dari mana izin berasal dan siapa yang memberikannya. | **Proposed decision:** rekam rantai layer, dokumen, scope, serta atribusi pemberi/proses dalam bukti konseptual. |
| Integrity reference | Menampakkan perubahan authority/governance setelah tugas diberikan. | **Proposed decision:** ikat referensi baseline authority dan governance yang bisa dibandingkan. Referensi tanpa trust anchor tidak memadai. |
| Verification subject | Membatasi apa yang sebenarnya diperiksa. | **Proposed decision:** nyatakan change set Git dan comparison yang dievaluasi; jangan menyimpulkan tindakan tak tercatat atau semantik isi. |

**Locked invariant.** Path yang boleh berubah berbeda dari kewajiban rule. Contoh: repository mewajibkan test untuk perubahan `showroom/odec/**`; task hanya mengizinkan `showroom/odec/**` tetapi tidak `test/**`. Task tidak bisa menghapus kewajiban parent atau menambahkan path test sendiri. **Proposed decision:** evaluator melaporkan konflik/bukti kewajiban tak terpenuhi dan owner harus mengubah authority atau memutuskan ulang pekerjaan secara eksplisit.

## 7. Matriks skenario dan hasil yang direkomendasikan

Semua path berikut ilustratif dan bukan struktur aktual proyek. “Repository hasil” mengikuti hasil Contract v0; klaim task adalah sumbu penilaian konseptual terpisah.

| ID | Authority parent / task; perubahan aktual | Repository hasil | Penilaian task dan klaim | Alasan / bukti yang dibutuhkan |
| --- | --- | --- | --- | --- |
| S1 | Parent mengizinkan ODEC dan Vindue; tidak ada envelope; ODEC berubah; semua rule lolos. | `pass` | Tidak ada task pass; task compliance tidak dapat diklaim. | Contract v0 membatasi report ke repository mode; bukti hanya governance, comparison, change set. |
| S2 | Parent mengizinkan keduanya; envelope dipercaya mengizinkan ODEC; perubahan ODEC; semua rule lolos. | `pass` | Task pass terbatas pada ODEC dan change set/baseline yang diverifikasi. | Bukti repository identity, baseline, envelope/provenance/trust, rules efektif, diff lengkap. |
| S3 | Parent mengizinkan keduanya; task mengizinkan ODEC; perubahan ODEC dan Vindue; repository rules lolos. | `pass` | Task violation untuk Vindue; klaim compliance gagal. | Bukti path source/destination dan authority ODEC; repository pass tidak menutup pelanggaran task. |
| S4 | Parent mensyaratkan rule test; task mengizinkan ODEC; perubahan ODEC tanpa test. | `fail` bila rule parent terpicu dan bukti required path tak ada. | Task tidak dapat lolos; kewajiban parent tetap berlaku. | Evaluation required-path yang violated; task tidak dapat memberi pengecualian implisit. |
| S5 | Envelope untuk repo/baseline lain; perubahan ODEC pada repo atau baseline ini. | Repository dapat dinilai berdasarkan input valid dan governance lokal. | Task compliance tidak dapat diklaim; mismatch perlu input/binding error pada evaluasi task. | Identitas repo dan comparison baseline harus cocok; jangan menggunakan authority yang salah. |
| S6 | Task mencoba menambah Vindue di luar parent atau memilih hanya rule yang menguntungkan. | Menurut repository checks lokal, hasil dapat pass/fail/review tersendiri. | Perluasan/penghilangan parent tidak valid; task tidak pass. | Effective authority/rules beserta provenance parent dan deklarasi task. |
| S7 | Envelope/aturan berubah setelah grant, atau provenance/trust tidak cukup. | Repository dapat dinilai terhadap governance aktual yang valid. | Task compliance tidak dapat diklaim sampai binding/trust cukup; perubahan yang terdeteksi bukan pass. | Referensi integritas, versi/baseline, asal trusted, dan sumber authority. Jika governance sendiri invalid, Contract v0 memberi configuration error. |
| S8 | Parent mewajibkan test pada path yang tidak diizinkan task; perubahan source tanpa test. | `fail` jika rule repository terbukti dilanggar. | Konflik authority eksplisit; task tidak boleh memperluas envelope. | Rule parent, task boundary, changed paths. Owner memilih memperluas task, mengubah pekerjaan, atau keputusan governance yang sah. |

**Locked invariant.** Contract v0 memperlakukan rename sebagai dua path facts; deletion tetap governed. `added`, `modified`, `deleted`, `renamed` didukung. Sumber: Verification Contract v0, “Normalized Inputs” (commit `28e0259`). **Proposed decision:** Task Contract berikutnya harus mempertahankan makna source/destination ketika rename melintasi batas scope; jangan memutuskan algoritma Git baru di sini. Copy, submodule, perubahan tak terlacak, dan aksi di luar diff tidak tercakup oleh klaim berbasis change set ini.

## 8. Deferred implementation details

**Deferred implementation detail — tahap ADR/contract/schema berikutnya.** Tunda nama dan field envelope, format file, CLI/API/JSON, rule type atau reason code baru, urutan precedence yang lebih rinci, algoritma collector Git, canonicalization dan hashing/signature, storage, identitas/approval provider, lifecycle/revocation, transport CI, serta UX diagnostik. Memo ini juga tidak mengesahkan `pakemin context` atau perubahan kontrak v0.

## 9. Konflik, pertanyaan owner, dan dampak keputusan

**Temuan konflik status.** Brief menempatkan v0.2.0 sebagai baseline dan v0.2.1 sebagai patch terpisah. Checkout pada `28e0259` memiliki v0.2.0 normative docs dan tidak menunjukkan artefak pekerjaan 01. Maka status v0.2.1 belum dapat dipastikan; ini tidak menghalangi memo, tetapi perlu diselesaikan atau diputuskan sebelum scope rilis vNext.

**Proposed decision — keputusan yang diminta dari owner:**

1. Setujui batas klaim: task compliance hanya untuk change set terikat; bukan bukti sandbox, correctness semantik, atau seluruh tindakan agent.
2. Setujui irisan authority task dan prinsip bahwa kewajiban parent tidak hilang ketika batas task lebih sempit; konflik harus kembali ke owner.
3. Setujui daftar makna binding minimum pada bagian 6 sebagai dasar ADR, tanpa mengunci representasi.
4. Tentukan trust anchor yang diterima secara konseptual sebelum menetapkan mekanismenya; apakah authority hanya dari repository-visible governance/explicit owner grant, atau juga dapat bersumber dari proses organisasi yang terikat.
5. Setujui pemisahan hasil repository, pelanggaran task, review, klaim tak tersedia, dan input/evaluasi invalid; tentukan apakah kontrak mendatang perlu outcome task tersendiri.

Dampak bila diterima: membuka pekerjaan ADR Task Envelope dan kontrak task-aware. Dampak bila belum diterima: tetap gunakan pemeriksaan repository v0 tanpa mengklaim task compliance. Tidak ada keputusan rilis yang timbul otomatis.

## 10. Acceptance checklist dan readiness menuju ADR

- [x] Artefak ini memo Markdown mandiri untuk review, bukan ADR atau kontrak.
- [x] Baseline, sumber, dan keterbatasan verifikasi dicatat; status v0.2.1 tidak direka.
- [x] Lima pertanyaan inti memiliki rekomendasi dan pertanyaan owner yang spesifik.
- [x] Rekomendasi dilabeli; keputusan produk dibedakan dari implementasi.
- [x] S1–S8 mencakup envelope hilang/valid, perubahan luar task, pelanggaran parent, mismatch, ekspansi, trust/integrity, dan konflik test.
- [x] Repository pass dipisahkan dari task compliance, semantic correctness, dan tindakan agent yang tidak tampak di diff.
- [x] Task tidak memperluas authority parent atau membuang rule parent.
- [x] Identitas task/repo, baseline, path, rules, provenance, trust, integritas, dan verification subject dibahas.
- [x] Review tidak dianggap authority; pelanggaran, klaim tak tersedia, invalid input, dan evaluasi error dipisahkan.
- [x] Tidak mengubah Verification Contract v0, schema, JSON, reason code, precedence, atau exit code.
- [x] Detail implementasi tetap deferred; tidak ada source, test, README, CI, atau versi yang diubah.
- [ ] Owner menerima atau merevisi lima keputusan pada bagian 9.
- [ ] Status patch v0.2.1 ditutup atau diputuskan sebelum rilis vNext.

**Proposed decision.** Memo siap untuk review owner sebagai bahan keputusan, bukan “ready for ADR” tanpa syarat. ADR dapat dimulai setelah owner menyetujui batas klaim, konflik parent/task, trust semantics, dan taksonomi hasil di atas.
