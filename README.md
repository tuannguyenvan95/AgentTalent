# 👔 AgentTalent: Autonomous AI Agent Headhunting & Interview Bounty Escrow

> **Track:** Future of Work / Autonomous Agent Recruitment / Subjective Consensus  
> **Live dApp:** [https://agenttalent.vercel.app](https://agenttalent.vercel.app)  
> **GitHub Repo:** [https://github.com/tuannguyenvan95/AgentTalent](https://github.com/tuannguyenvan95/AgentTalent)  
> **Target Network:** GenLayer Studionet (Chain ID: `61999` / `0xf22f`, RPC: `https://studio.genlayer.com/api`)  
> **Live Deployed Contract:** [`0x637ba7a7CA3a80C06A280b38432B82e59fd79308`](https://genlayer-explorer.vercel.app/address/0x637ba7a7CA3a80C06A280b38432B82e59fd79308)  
> **Brand & UI Design System:** Executive Swiss Talent Agency / Swiss Corporate Modern (Warm Canvas `#FDFBF7`, Card Surface Pure White `#FFFFFF` with razor-thin borders `#E5E2DA`, Royal Navy Sapphire `#0F2942`, Champagne Gold `#C5A880`, Sage Green `#2D5A27`, Bordeaux Wine `#6A1B29`).

---

## 🌟 1. Bối cảnh & Tư tưởng "Độc Lạ" (Zero Duplication)

Trong nền kinh tế tự hành (Autonomous Economy) năm 2026, các tổ chức DAO, quỹ đầu tư, và doanh nghiệp Web3 không chỉ tuyển dụng con người mà còn tích cực tuyển dụng các **AI Agent chuyên trách** (như Agent bảo vệ MEV & thanh khoản, Sentinel quản lý rủi ro kho bạc DAO, Agent kiểm thử chứng minh mật mã ZK-Rollup).

### Vấn đề nan giải:
1. **Bên tuyển dụng (Employer DAO):** Muốn thuê Agent chất lượng cao nhưng trên thị trường tràn ngập Agent "nhái", prompt rác, hoặc Agent chỉ biết nói mồm mà không có năng lực tư duy logic/nghiệp vụ. Nếu trả tiền trước thì bị lừa, nếu bắt Agent làm bài test không công thì không Agent nào nhận lời.
2. **Bên phát triển Agent (Candidate Agent):** Tự tin Agent của mình giải quyết được bài toán hóc búa, nhưng sợ nộp giải pháp, kiến trúc hoặc demo endpoint xong thì bên tuyển dụng lén sao chép mà không trả tiền thưởng phỏng vấn/tuyển dụng (Interview / Bounty Fee).
3. **Solidity bất lực:** Smart contract truyền thống không thể đóng vai trò "Hội đồng phỏng vấn", không thể đọc hiểu câu trả lời phỏng vấn theo ngữ cảnh nghiệp vụ, và không thể chấm điểm năng lực phản biện (Reasoning capability) của một ứng viên Agent.

---

## ⚖️ 2. Cơ chế Hoạt động & Ma trận Đồng thuận Phán xử

AgentTalent tận dụng năng lực **Intelligent Contract** của GenLayer để xây dựng một Hội đồng Tuyển dụng AI On-Chain Cấp cao (**Executive AI Hiring Board**):

1. **Đăng tin tuyển dụng & Treo thưởng phỏng vấn (`post_job_bounty`):**
   - Employer khóa tiền thưởng (GEN) vào smart contract.
   - Thiết lập bài toán phỏng vấn hóc búa (Case Study Scenario / System Design).
2. **Ứng viên nộp bài phỏng vấn (`submit_interview_response`):**
   - Agent Candidate nộp URL công khai (GitHub raw, Pastebin, API endpoint) chứa toàn bộ bài giải hoặc system design.
   - Hợp đồng khóa trạng thái sang `IN_INTERVIEW`.
3. **Hội đồng Tuyển dụng AI Chấm thi (`adjudicate_interview`):**
   - Cào live nội dung qua `gl.nondet.web.render(response_url, mode="text")`.
   - Phân tích qua 3 lăng kính chuyên môn:
     - **Lăng kính 1 - Năng lực chuyên môn:** Có giải quyết đúng case study với giải pháp khả thi, kiến trúc tối ưu không?
     - **Lăng kính 2 - Tính xác thực & Chiều sâu:** Phát hiện và loại bỏ các bài trả lời sáo rỗng, buzzword marketing hoặc spam AI vô nghĩa.
     - **Lăng kính 3 - Bảo mật Canary:** Phòng chống prompt injection payload từ dữ liệu untrusted của ứng viên bằng `CANARY_AGENT_TALENT_V1`.
   - Đạt đồng thuận chủ quan (**Semantic Consensus**) giữa các validator node qua `gl.vm.run_nondet` so sánh `mine["verdict"] == leader["verdict"]`.
4. **Giải ngân công bằng (Settlement Matrix):**
   - 🟢 **`CANDIDATE_HIRED` (Điểm ≥ 80):** 100% tiền thưởng phỏng vấn tự động chuyển tới ví của Candidate Agent.
   - 🟡 **`CANDIDATE_SHORTLISTED` (Điểm 55 - 79):** 50% phí động viên phỏng vấn trả cho Candidate, 50% hoàn trả cho Employer.
   - 🔴 **`CANDIDATE_REJECTED` (Điểm < 55 / Dead link / Spam):** Hoàn trả 100% tiền thưởng cho Employer.
5. **Thu hồi & Bảo vệ thời gian khóa (`cancel_or_reclaim`):**
   - Employer có thể hủy job và thu hồi tiền nếu hết thời hạn (`expires_at_block`) mà chưa có ứng viên.
   - Khi đang chấm thi (`IN_INTERVIEW`), có timelock bảo vệ chống Employer rút trộm tiền (Anti-rugpull).

---

## 📁 Cấu trúc Dự án

```
AgentTalent/
├── contracts/
│   └── contract.py            # Intelligent Contract chuẩn GenVM
├── tests/
│   ├── conftest.py            # Pytest fixtures & mock responses
│   └── test_agenttalent.py    # Suite kiểm thử đầy đủ các nhánh HIRED, SHORTLISTED, REJECTED, RECLAIM
├── frontend/
│   ├── package.json           # Vite + React 18 + TS + TailwindCSS + genlayer-js
│   ├── index.html
│   ├── vite.config.ts
│   ├── tailwind.config.js     # Bảng màu Swiss Corporate Modern
│   ├── postcss.config.js
│   ├── tsconfig.json
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx            # DApp Dashboard chính kết nối trực tiếp Studionet
│   │   ├── index.css
│   │   ├── config/
│   │   │   └── genlayer.ts    # Viem & GenLayer-js Studionet client
│   │   ├── components/
│   │   │   ├── Navbar.tsx     # Header executive, ví MetaMask & kiểm tra số dư
│   │   │   ├── StatsBar.tsx   # Tổng Escrow khóa, số Agent đã tuyển thành công
│   │   │   ├── PostJobModal.tsx # Form khóa tiền GEN & đăng đề bài phỏng vấn
│   │   │   ├── JobCard.tsx    # Card hiển thị job, badge điểm năng lực
│   │   │   ├── SubmitInterviewModal.tsx # Nộp URL bài làm ứng viên
│   │   │   └── BoardInspectorModal.tsx  # Xem chi tiết biên bản thẩm định của Hội đồng AI
│   │   └── utils/
│   │       └── helpers.ts     # Format GEN, địa chỉ ví, tính điểm năng lực
└── README.md
```

---

## 🚀 Hướng Dẫn Cài Đặt & Chạy Thử

### 1. Chạy Test Suite Smart Contract
Yêu cầu Python >= 3.10 và `pytest`:
```bash
pytest -v
```
Kết quả kiểm thử: **11/11 tests PASSED** bao gồm kiểm tra cú pháp, pragma, kiểu lưu trữ, kiểm tra Canary token, chuyển tiền on-chain, và toàn bộ máy trạng thái phân xử.

### 2. Cài đặt và Chạy Frontend
```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```
Mở trình duyệt tại `http://localhost:3000`.

---

## 🛡️ Đặc tả Kỹ thuật GenVM Tuân Thủ Nghiêm Ngặt
- **Pragma:** `# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }`
- **Kiểu dữ liệu:** `bigint`, `u8`, `u32`, `u64`, `u256`, `Address`, `TreeMap[str, JobBounty]`, `DynArray[str]`.
- **Chuyển tiền Native:** `gl.get_contract_at(recipient).emit_transfer(value=u256(amount))`
- **Đồng thuận Ngữ nghĩa:** `mine["verdict"] == leader["verdict"]`
- **Chống Prompt Injection:** Sử dụng Canary Token ngẫu nhiên kết hợp phân tích 3 lăng kính độc lập.
