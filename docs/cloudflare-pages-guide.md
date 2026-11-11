# GitHub → Cloudflare Pages 網站部署指南

適用：Moonshot 射月計畫；之後可複用於 Tommy 學長的網站。

## 本次遷移結果

私人 repo 已建立並推送。本機 build 通過。Cloudflare 尚未登入或連接，因此部署與 pages.dev 網址待驗證。GitHub Actions 首次執行回報 startup_failure，未建立 jobs，無可用 logs，詳細原因待登入 GitHub 檢查，不視為 CI 通過：https://github.com/SuBoYu/moonshot-website/actions/runs/42959450527

Notion 指南：https://app.notion.com/p/41570bdecd7481fb8328d585f2560b47

## 目前進度與依據

- 個人網站參考： https://github.com/SuBoYu/tonysu 。README 指定 Cloudflare Pages Git integration、main 正式分支、pnpm build、dist 輸出；記錄網址為 https://tonysu.pages.dev 。這是 repo 文件資訊，未登入 Cloudflare 核對帳號狀態。
- Moonshot 原始碼已整理為獨立專案；本機建置與導覽、JavaScript 語法、品牌連結檢查通過。
- Cloudflare 專案連接、首次部署、正式網址與 DNS 尚待設定及驗證。不要把預計的 pages.dev 網址當成已上線。
- 舊 Sites 原型保留；GitHub 新 repo 作為後續正式原始碼來源，兩者不會自動同步。

## 架構與責任

GitHub 保存原始碼 → Pull Request 執行 GitHub Actions 檢查 → Cloudflare 自動產生分支預覽 → 合併 main → Cloudflare 建置並部署正式網站。

沿用 Tony 的託管模式，沒有為了搬家重寫 Astro。Moonshot 是無外部依賴的靜態網站，修改 src/index.html 即可；npm run build 先檢查，再產生 dist/index.html。Cloudflare 使用 Git integration，不需要另設 API token 或將機密放進 Notion。

GitHub 檢查與 Cloudflare 部署是各自執行的：若未設定分支規則，GitHub 檢查失敗不會自動阻止 main 的部署。Cloudflare 的 build command 也會執行同一組檢查，建置失敗時不會發布該次更新。

## 一次性設定：連接 Cloudflare

1. 使用託管 tonysu 的 Cloudflare 帳號登入 https://dash.cloudflare.com/ 。進入 Workers & Pages，確認看得到 tonysu。
2. 選擇建立應用程式，再選 Pages 的 Connect to Git / Import an existing Git repository。若畫面預設為 Workers，切換到 Pages；不要建立 Direct Upload 專案。
3. 選擇 GitHub 帳號 SuBoYu，選取 moonshot-website。若清單沒有 repo，進 GitHub Settings → Applications → Installed GitHub Apps → Cloudflare Workers and Pages → Configure，將該 repo 加到可存取清單，保留原有 repo。
4. 輸入下表設定並儲存部署。專案名稱只是預定名稱，若衝突須換名，使用 Cloudflare 實際回傳的網址。

| 欄位 | Moonshot 設定 |
| --- | --- |
| Repository | SuBoYu/moonshot-website |
| Project name | moonshot-website（若可用） |
| Production branch | main |
| Framework preset | None |
| Root directory | 留空，使用 repo 根目錄 |
| Build command | npm run build |
| Build output directory | dist |
| Environment variable | NODE_VERSION = 22（若環境需要明確指定） |

5. 等首次部署顯示 Success。開啟實際回傳的 HTTPS pages.dev 網址，記錄在本頁的專案資訊表。
6. 在專案 Settings / Build / Branch control 確認 production 自動部署開啟，並啟用非 main 分支的 preview deployments。實際欄位名稱可能隨 Cloudflare 介面調整。
7. 私人 GitHub repo 不代表網站私人。Cloudflare Pages 的預設網址可被外部瀏覽；若內容需要限閱，另行設置 Cloudflare Access。不要把機密放進靜態網站。

## 驗證自動部署

1. 從 main 開一個測試分支，做可逆的小修改並開 Pull Request。
2. GitHub Actions → Website checks 必須成功；PR 中應可找到 Cloudflare 狀態或 preview URL。
3. 開啟預覽，確認中文、手機選單、開始收聽定位、六個平台入口與聯絡信箱。
4. 合併 main，確認 Cloudflare Deployments 中對應同一 commit 的 production deployment 成功。
5. 開啟正式網址，確認修改已生效。這一步通過後，才算 CI/CD 遷移完成。

## 網域設定：先免費網址，再綁正式網域

pages.dev 不需要另外購買網域或修改 DNS。若還沒決定正式網域，先用此網址即可。

若已有自有網域：

1. 在 Pages 專案 → Custom domains → Set up a domain 輸入正式網域，先在 Pages 登記，不能只自行加一條 DNS 記錄。
2. 根網域（例如 example.com）：網域需加入同一 Cloudflare 帳號成為 zone，並在註冊商設定 Cloudflare 指派的 nameservers。變更前完整保留既有 MX、TXT 與其他 DNS 記錄，尤其是電子郵件設定。
3. 子網域（例如 podcast.example.com）：可沿用外部 DNS，依 Pages 指示新增 CNAME，目標為該專案實際的 project.pages.dev。目標不可帶 https:// 或路徑。
4. 回到 Custom domains，等狀態 Active、憑證生效後，以 HTTPS 開啟驗證。
5. 若同時使用根網域與 www，先綁定兩者並選定唯一主要網址，再設定 www/根網域轉址。需要將 pages.dev 導向正式網域時，可依官方 Bulk Redirects 指南設定；確認不要把 preview 網址一起轉走。
6. 網址確定後，再新增或更新 canonical、Open Graph URL、robots 與 sitemap。Moonshot 目前未假設正式網域，也未加入虛構的 canonical URL。

已確認先使用 Cloudflare 免費 pages.dev 網址，之後再綁正式網域；目前不需要購買網域或設定 DNS。

## 每次更新

1. 在 GitHub repo 開分支，修改 src/index.html。
2. 執行 npm run build；需要本機預覽時執行 npm run preview，開 http://localhost:4173。
3. 推送分支、開 PR、檢查 CI 和 Cloudflare 預覽。
4. 合併 main 後檢查正式部署與網站。不要再平行修改舊 Sites 作為正式來源。

## 回復與排錯

- Repo 不出現在 Cloudflare：確認 GitHub App 安裝在正確帳號、允許新的私人 repo。
- 404：輸出目錄應為 dist，且建置輸出包含 index.html；不要把 src 或 repo 根目錄設為輸出。
- Build 失敗：看 Cloudflare logs；確認 Node.js 22、npm run build、repo root 正確。
- main 沒更新：確認 production branch=main、自動部署已啟用，並比對 deployment commit。
- 網域 Pending：確認先在 Pages 登記，再檢查 CNAME/nameserver；待 DNS 與憑證完成。
- 緊急回復：在 Cloudflare production deployment 的操作中選 rollback 到已知正常版本；接著在 GitHub revert 問題 commit，避免下次部署再次帶回問題。若介面沒有 rollback，直接透過 GitHub revert 並重新部署。

## Tommy 學長網站：複用清單

- [ ] 確定網站與 repo 的所有者、Cloudflare 帳號管理者及網域擁有者；可讓學長自己持有帳號，避免日後交接。
- [ ] 建立獨立 repo；不複製 Moonshot 身分、連結、Sites 設定或憑證。
- [ ] 確認技術種類：相同靜態格式可沿用 Moonshot build；Astro 專案則依自身 package.json 使用 pnpm build，不直接套錯指令。
- [ ] 先完成本機建置、手機預覽與內容確認。
- [ ] Cloudflare Pages → Connect to Git → 授權該 repo。
- [ ] 設定 main、正確 build command、dist 與 Node.js 版本。
- [ ] 驗證 PR preview、main 自動部署與實際網址。
- [ ] 確認自有網域後才設定 DNS、HTTPS 和主要網址轉址。
- [ ] 記錄專案資訊並交接帳號存取方式；不記錄密碼或 token。

## 專案資訊（設定時填入）

| 項目 | Moonshot | Tommy |
| --- | --- | --- |
| GitHub repo | https://github.com/SuBoYu/moonshot-website | 待建立 |
| Cloudflare project | 待建立/核實 | 待建立 |
| pages.dev 實際網址 | 待首次部署回傳 | 待首次部署回傳 |
| 正式網域 | 待決定 | 待決定 |
| PR preview 驗證 | 待完成 | 待完成 |
| main 自動部署驗證 | 待完成 | 待完成 |

## 來源

- Tony 專案 README：https://github.com/SuBoYu/tonysu/blob/main/README.md
- Cloudflare Git integration：https://developers.cloudflare.com/pages/configuration/git-integration/
- Build settings：https://developers.cloudflare.com/pages/configuration/build-configuration/
- Custom domains：https://developers.cloudflare.com/pages/configuration/custom-domains/
- pages.dev 轉址：https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/
