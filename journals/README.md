# CreatorOS — Technical Journal Guidelines

Each team member is required to maintain a technical journal documenting their weekly progress, engineering decisions, architectural contributions, and debugging workflows.

---

## 📌 Journal Rules & Standards

1. **Frequency:** Update frequency is **at least once weekly**.
2. **Format:** Markdown format (`.md`).
3. **Folder Naming Convention:**
   Each member must create their dedicated folder inside `journals/` using the format:
   ```text
   journals/<ROLLNO>-<FIRSTNAME>/
   ```
   **Examples:**
   - `journals/1024030101-mrityunjay/`
   - `journals/1024030202-bhanurekha/`

4. **File Naming Convention:**
   Within your folder, create individual files for each week:
   - `week-01.md`
   - `week-02.md`
   - `week-03.md`
   - ...

5. **Writing Standard:**
   - **Technical Writing, Not Creative Writing:** Focus on engineering progress, system architecture, database schema changes, formula derivations, API integrations, and code implementations.
   - **Evidence & Traceability:** Include commit hashes, code snippets, formula definitions, pull request references, and test results.
   - **Reflective Problem Solving:** Document blockers encountered, technical root causes, and how you resolved them.

---

## 📋 Weekly Journal Template

To maintain consistency across all team members, use the standardized structure provided in [`TEMPLATE.md`](TEMPLATE.md):

```markdown
# Weekly Technical Journal — Week [XX]

- **Author:** [Your Name]
- **Roll Number:** [Your Roll Number]
- **Date Range:** [Start Date] – [End Date]
- **Module Focus:** [e.g., Negotiation Engine / Contract Intelligence / Frontend UI]

---

## 🎯 Weekly Objectives
- [ ] Goal 1
- [ ] Goal 2

## 💻 Technical Contributions & Implementation Details
- Detailed explanation of algorithms, state machines, or components built.
- Architecture diagrams / schemas modified.
- Code snippets illustrating key logic.

## 🚧 Challenges, Blockers & Solutions
- **Issue:** Description of the bug or architectural roadblock.
- **Root Cause:** Why the issue occurred.
- **Resolution:** How it was resolved.

## 🔗 Commits & PRs
- `[commit-hash]` - Brief commit message

## 🔮 Next Week's Plan
- Target deliverables for the upcoming week.
```

---

## 📂 Active Team Members

| Roll Number | Member Name | Journal Folder |
|---|---|---|
| Lead / Dev | Mrityunjay Chaturvedi | [`mrityunjay/`](mrityunjay/) |
| *[Roll No]* | *[Team Member]* | `[RollNo-FirstName]/` |
