---
name: addlaws
description: "Automatically format and add Chinese laws to VuePress-based legal library. Supports batch processing with progress tracking via LAWS_PROGRESS.md."
allowed-tools: [Read, Write, Edit, Glob, Grep, Bash]
license: MIT
source: https://github.com/justlaws/just-laws
---

# AddLaws - Chinese Law Addition Skill

## Overview

AddLaws is an automated skill for adding Chinese laws to the Just Laws VuePress-based legal documentation site. It handles the complete workflow from reading raw Markdown files to formatting, organizing, updating navigation configuration, tracking progress, and committing changes.

**Key Features**:
- Automatically format and structure Chinese legal documents
- Support for single law and batch processing modes
- Progress tracking via `LAWS_PROGRESS.md`
- Automatic English name translation and directory naming
- VuePress navigation configuration updates
- Git commit automation with emoji markers

**Prerequisites**:
- Raw law files must be converted from DOCX to Markdown using markitdown
- Files located in `.temp/laws_md/` directory
- `LAWS_PROGRESS.md` must exist in project root

---

## Usage

### Single Law Mode

To add a single law, provide the Markdown file path:

```bash
/addlaws .temp/laws_md/中华人民共和国爱国主义教育法_20231024.md
```

**Required Parameter**:
- `file`: Path to Markdown file in `.temp/laws_md/` directory

**What happens**:
1. Extracts law name from filename or content
2. Translates to English directory name
3. Determines category from `LAWS_PROGRESS.md`
4. Checks if law already exists
5. Formats content according to specifications
6. Creates directory and files
7. Updates `docs/.vuepress/config.js`
8. Updates `LAWS_PROGRESS.md`
9. Commits changes with emoji marker

### Batch Mode (Recommended)

To process all unadded laws automatically:

```bash
/addlaws --batch
```

**No parameters required**

**What happens**:
1. Reads `LAWS_PROGRESS.md` to find all unadded laws
2. Processes each law in order
3. Finds corresponding `.md` file in `.temp/laws_md/`
4. Executes complete workflow for each law
5. Updates `LAWS_PROGRESS.md` after each law
6. Creates individual git commit per law

**Batch Mode Advantages**:
- Fully automated processing of all unadded laws
- Real-time progress tracking
- Individual commits for traceability
- No manual file specification needed

---

## Directory Structure

```
docs/
├── .vuepress/
│   └── config.js           # Navigation configuration
├── constitution/              # 宪法
├── constitutional-relevance/  # 宪法相关法 (54 laws)
├── civil-and-commercial/      # 民商法 (25 laws)
├── administrative/            # 行政法 (96 laws)
├── economic/                  # 经济法 (88 laws)
├── social/                    # 社会法 (30 laws)
├── criminal-law/              # 刑法 (4 laws)
└── procedural/                # 程序法 (10 laws)

.temp/
└── laws_md/                   # Source Markdown files
    └── 中华人民共和国{法律名称}_{日期}.md

LAWS_PROGRESS.md               # Progress tracking (308 total laws)
```

---

## Category Mapping

| Chinese Name | Directory Name | Law Count |
|--------------|----------------|-----------|
| 宪法 | constitution | 1 |
| 宪法相关法 | constitutional-relevance | 54 |
| 民商法 | civil-and-commercial | 25 |
| 行政法 | administrative | 96 |
| 经济法 | economic | 88 |
| 社会法 | social | 30 |
| 刑法 | criminal-law | 4 |
| 程序法 | procedural | 10 |

---

## Formatting Rules

### File Structure

```markdown
---
sidebar: auto
---

# 中华人民共和国{法律名称}

{立法修法记录 - 每条记录单独一行}

## 第一章　总则

**第一条**　条文内容...

**第二条**　条文内容...
```

### Critical Formatting Requirements

1. **Frontmatter** (must start at line 1):
   ```markdown
   ---
   sidebar: auto
   ---

   ```

2. **Title** (blank line after frontmatter):
   ```markdown
   # 中华人民共和国{法律名称}

   ```

3. **Legislative Records**:
   - Each record on a separate line
   - **Blank line between each record** (critical!)
   - Remove spaces between Chinese characters and numbers
   - **IMPORTANT: Must NOT contain full-width parentheses `（` or `）`**
   ```markdown
   2021年8月20日第十三届全国人民代表大会常务委员会第三十次会议通过

   根据2023年12月29日第十四届全国人民代表大会常务委员会第七次会议《关于修改〈中华人民共和国XXX法〉的决定》修正

   ```
   - Blank line after last record
   - ❌ Wrong: `（2021年8月20日...）`
   - ✅ Correct: `2021年8月20日...`

4. **Chapter Titles**:
   - Use `## ` level (secondary heading)
   - Preserve Chinese space after "章"
   - Example: `## 第一章　总则` (Chinese space `　` after "章")
   - Section title: `### 第一节　一般规定`
   - Blank line after chapter title

5. **Article Numbers**:
   - Use bold: `**第X条**`
   - Followed by Chinese space `　` (U+3000)
   - Example: `**第一条**　为了保护个人信息权益...`

6. **Blank Line Rule** (most important):
   - **Blank line between ALL elements**
   - Between frontmatter and title
   - Between title and legislative records
   - Between legislative records and first chapter
   - Between chapter title and first article
   - Between articles
   - No blank line after last article

7. **Number Format Cleanup**:
   - Remove spaces between Chinese characters and numbers
   - Regex: `(\d+)\s+年` → `$1年`
   - Regex: `(\d+)\s+月` → `$1月`
   - Regex: `(\d+)\s+日` → `$1日`

---

## Workflow

### Step 1: Determine Law Information

**Extract Full Name**:
- Priority: From filename (`中华人民共和国爱国主义教育法_20231024.md` → `中华人民共和国爱国主义教育法`)
- Fallback: From first line or content
- No user interaction required

**Translate English Name**:
- Automatically translate from full name
- Naming convention: lowercase, hyphen-separated, without "the"
- Examples:
  - `中华人民共和国爱国主义教育法` → `patriotism-education-law`
  - `中华人民共和国种子法` → `seed-law`
  - `中华人民共和国个人信息保护法` → `personal-information-protection-law`

**Determine Category**:
- Look up directly from `LAWS_PROGRESS.md`
- The category where the law appears is its category
- No additional query needed

### Step 2: Check if Law Exists

**IMPORTANT**: Before creating content, must check if law is already added.

1. **Check File System**
   - Use Grep to search `docs/` directory for law full name
   - If found, read content to confirm it's the same law

2. **Check Configuration**
   - Use Grep to search `docs/.vuepress/config.js` for law short name (without "中华人民共和国")
   - Check if already in navigation configuration

3. **Handle Existing Law**:
   - **If law exists**:
     - Extract effective date from current md file (usually in legislative records)
     - Extract effective date from existing file
     - Compare dates, use latest version
     - **Default category is correct, do not modify**
     - If newer version:
       * Backup old file (add .old suffix)
       * Replace with new file
       * Update md content if needed
       * Commit with update message
     - If same or older version: Notify user and stop

   - **If law does not exist**: Continue creation process

### Step 3: Read and Format Markdown Content

**IMPORTANT**:
- ⚠️ **Must use AI model to directly understand raw md file and manually format, do not use script for auto-formatting**
- AI has stronger context understanding for handling special cases (chapter titles, article nesting, list formats, etc.)
- Scripts prone to format errors, require repeated debugging; AI can generate correct format in one pass
- Use Read tool to read original file, then use Write tool to create formatted file according to format requirements below

**Read Source File**:
- **File Location**: Search in `.temp/laws_md/` directory, filename contains law name
- Use Glob or Read tool to read corresponding md file
- Save original content for reference

**Analyze Law Structure**:
- Count articles (search for "**第" to confirm)
- Extract legislative records (usually at beginning of file)
- Confirm chapter structure (chapters, sections)
- Determine if file needs splitting (200+ articles)

**Format Content** (strictly execute):

For laws with **fewer than 200 articles**, create single `README.md` file.

For laws with **200+ articles**:
- Inform user that file needs to be split
- Reference [Civil Code](docs/civil-and-commercial/civil-code/) structure
- Create independent markdown file for each book (编)
- Configure sidebar in config.js

### Step 4: Create Law Directory

Create directory: `docs/{category}/{english-name}/`

**Directory Naming Convention**:
- All lowercase letters
- Separate words with hyphens `-`
- Do not include "the" or "The People's Republic of China"
- Examples: `personal-information-protection-law`, `seed-law`

### Step 5: Create Formatted File

Use Write tool to create `docs/{category}/{english-name}/README.md` file with formatted content.

**Validation Points**:
- Ensure file is created
- Ensure format meets specifications
- Ensure content is complete (all chapters, articles)

### Step 6: Update Navigation Configuration

Edit `docs/.vuepress/config.js`:

1. **Find corresponding category** (in `navbar` array)
2. **Add navigation item**:
   ```javascript
   { text: "{法律简称}", link: "/{category}/{english-name}/" },
   ```

**Important Notes**:
- `link` path must start with `/`
- `link` path must end with `/` (indicating directory)
- `link` path **must not contain spaces or Chinese characters**
- `text` uses law short name, usually omitting "中华人民共和国"
- Example: `{ text: "爱国主义教育法", link: "/social/patriotism-education-law/" }`

**Validation**:
- Ensure added under correct category
- Ensure no duplicate entries
- Ensure file path matches actual created path

### Step 7: Update Progress Tracking

Edit root directory `LAWS_PROGRESS.md`:

1. **Update Law Status**:
   - Find corresponding law entry
   - Change `未收录` to `✅ 已收录`

2. **Update Category Progress**:
   - Find corresponding category progress statistics
   - Update numerator (added count)
   - Update percentage
   - Example: `**进度：14/88 (15.9%)**` → `**进度：15/88 (17.0%)**`

3. **Update Total Progress**:
   - Update total progress at top of file
   - Update total statistics at bottom
   - Example: `**收录进度：50/308 (16.2%)**` → `**收录进度：51/308 (16.6%)**`

4. **Update Statistics Table**:
   - Update corresponding category progress in statistics section at end of file
   - Example: `- **经济法**：14/88 (15.9%)` → `15/88 (17.0%)`

### Step 8: Commit Code

**IMPORTANT**: When committing, must include all modified project files and exclude temporary files and auxiliary files. Files to commit generally include:
- `docs/.vuepress/config.js`
- `docs/{category}/{english-name}/README.md`
- `LAWS_PROGRESS.md` in root directory

**Commit Command**:
```bash
git add docs/{category}/{english-name}/README.md docs/.vuepress/config.js LAWS_PROGRESS.md
git commit -m "📘 收录《{法律名称}》"
```

**Commit Message Specification**:
- Use emoji book series (different colors available):
  - 📘 (blue book) - New law
  - 📗 (green book) - New law
  - 📙 (orange book) - New law
  - 📕 (red book) - New law
- Use Chinese book title marks 《》 for law name
- Format: `{emoji} 收录《{law_name}》`

**Special Cases**:
- If updating content: `git commit -m "📝 更新《{law_name}》"`
- If fixing format: `git commit -m "🔧 修正《{law_name}》格式"`
- If replacing version: `git commit -m "🔄 替换《{law_name}》为最新版本"`

---

## Troubleshooting

### Issue 1: Law Exists But Version Updated

**Handling Steps**:
1. Compare effective dates of old and new files
2. Backup old file (add .old suffix)
3. Replace with new file
4. Maintain original category and configuration
5. Commit with version update message

### Issue 2: Markdown File Format Non-compliant

**Handling Steps**:
1. Check if frontmatter exists and format is correct
2. Check if blank lines exist between all elements
3. Check if article numbers are bold
4. Check if chapter title levels are correct
5. Use regex to batch fix common issues

### Issue 3: Article Count Exceeds 200

**Handling Steps**:
1. Inform user that file needs splitting
2. Analyze law's book (编) and chapter structure
3. Create independent markdown file for each book
4. Configure sidebar in config.js
5. Reference Civil Code implementation

### Issue 4: Link Path Error

**Handling Steps**:
1. Check if link path starts and ends with `/`
2. Check if path contains spaces or Chinese characters
3. Check if actual file path matches link
4. Use forward slash `/` not backslash `\`

---

## Notes

### Data Sources
- User has converted DOCX to Markdown via markitdown
- Assume DOCX comes from authoritative sources (NPC official website or National Laws and Regulations Database)

### Format Details
- **Chinese Space**: Space after chapter title and article number is Chinese space `　` (U+3000)
- **Blank Lines**: Most common error, ensure blank lines between all elements
- **Number Format**: Remove spaces between Chinese characters and numbers
- **Link Paths**: No spaces, Chinese characters; use lowercase and hyphens

### Naming Conventions
- **Folder**: All lowercase, hyphen-separated, without "the"
- **Law Short Name**: Omit "中华人民共和国", keep core name
- **File Paths**: Use forward slash `/`, not backslash `\`

### Commit Specifications
- **Emoji**: 📘 (new), 🔄 (fix), 📝 (update)
- **Book Title Marks**: Use Chinese book title marks 《》 to wrap law name
- **Clear and Concise**: Commit message should clearly explain what was done

---

## Examples

### Example 1: Add New Law (< 200 Articles)

**User Input**:
```
Markdown file: .temp/laws_md/中华人民共和国爱国主义教育法_20231024.md
```

**Execution Result**:
1. Extract law name: From filename → `中华人民共和国爱国主义教育法`
2. Translate English name: `patriotism-education-law`
3. Query category: From LAWS_PROGRESS.md → 社会法
4. Check existence: Does not exist
5. Read md file and format:
   - Extract legislative records
   - Format chapter titles and article numbers
   - Ensure blank lines between all elements
   - Count articles: 40 articles (< 200, no split needed)
6. Create directory: `docs/social/patriotism-education-law/`
7. Create file: `docs/social/patriotism-education-law/README.md`
8. Update config.js: Add under social law category `{ text: "爱国主义教育法", link: "/social/patriotism-education-law/" }`
9. Update LAWS_PROGRESS.md:
   - Law status: 未收录 → ✅ 已收录
   - Social law progress: 3/30 → 4/30
   - Total progress: 45/308 → 46/308
10. Validate: File exists, link correct, format meets specifications
11. Commit: `git commit -m "📘 收录《爱国主义教育法》"` (can use 📗📙📕)

### Example 2: Add New Law (> 200 Articles)

**User Input**:
```
Markdown file: .temp/laws_md/中华人民共和国民法典_20200528.md
```

**Execution Result**:
1. Extract law name: From filename → `中华人民共和国民法典`
2. Translate English name: `civil-code`
3. Query category: From LAWS_PROGRESS.md → 民商法
4. Check existence: Does not exist
5. Read md file and format:
   - Count articles: 1260 articles (> 200)
   - Inform user that file needs splitting
6. Analyze structure: 7 books total, create independent file for each
7. Create directory: `docs/civil-and-commercial/civil-code/`
8. Create files:
   - `README.md` (General Provisions)
   - `property-rights.md` (Property Rights)
   - `contract.md` (Contract)
   - `personality-rights.md` (Personality Rights)
   - `marriage-and-family.md` (Marriage and Family)
   - `succession.md` (Succession)
   - `tort-liability.md` (Tort Liability)
9. Update config.js: Configure sidebar
10. Update LAWS_PROGRESS.md: Update law status and progress statistics
11. Validate and commit: `git commit -m "📗 收录《民法典》"`

### Example 3: Update Existing Law

**User Input**:
```
Markdown file: .temp/laws_md/中华人民共和国个人信息保护法_20240430.md
```

**Execution Result**:
1. Extract law name: From filename → `中华人民共和国个人信息保护法`
2. Translate English name: `personal-information-protection-law`
3. Query category: From LAWS_PROGRESS.md → 社会法
4. Check existence: Exists in `docs/social/personal-information-protection-law/`
5. Compare effective dates:
   - Old file: 2021年8月20日
   - New file: 2024年4月30日
   - New file is newer, execute replacement
6. Backup old file: `README.md` → `README.md.old`
7. Format new file content and replace
8. Validate: File format correct, content complete
9. Commit: `git commit -m "🔄 替换《个人信息保护法》为最新版本"`

### Example 4: Batch Processing Mode (Recommended)

**User Input**:
```
(No parameters, automatic batch processing)
```

**Execution Result**:
1. Read LAWS_PROGRESS.md, identify unadded laws (289 total)
2. Process first unadded law in order (e.g., 保守国家秘密法):
   - Read `.temp/laws_md/中华人民共和国保守国家秘密法_20240227.md`
   - Format content and create file
   - Update config.js
   - Update LAWS_PROGRESS.md
   - Commit: `git commit -m "📘 收录《保守国家秘密法》"`
3. Process second unadded law (e.g., 公共图书馆法):
   - Read source file
   - Format content and create file
   - Update config.js
   - Update LAWS_PROGRESS.md
   - Commit: `git commit -m "📘 收录《公共图书馆法》"`
4. Process remaining 287 unadded laws in order
5. After completion, LAWS_PROGRESS.md shows: `**收录进度：308/308 (100.0%)**`

**Batch Mode Features**:
- Fully automated, no manual intervention
- Individual commits per law, clear traceability
- Real-time progress updates, can check addition status anytime
- Can pause on issues, continue processing remaining laws next time

---

## Skill Completion Criteria

Skill execution is successful when all following steps are complete:
- ✅ Law file created in correct category directory
- ✅ File format meets specifications (frontmatter, blank lines, Chinese space)
- ✅ Content complete (all chapters, articles present)
- ✅ config.js updated (link path correct)
- ✅ LAWS_PROGRESS.md updated (law status, category progress, total progress)
- ✅ No duplicate entries
- ✅ Code committed (law file, config.js, LAWS_PROGRESS.md)

**Batch Mode Additional Criteria**:
- ✅ All unadded laws processed
- ✅ LAWS_PROGRESS.md shows complete addition: `**收录进度：308/308 (100.0%)**`
