const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const os = require("node:os");
const MarkdownIt = require("markdown-it");
const { lawArticleAnchorsPlugin } = require("../docs/.vuepress/markdown/lawArticleAnchors");
const { criminalOffenseAnnotationsPlugin } = require("../docs/.vuepress/markdown/criminalOffenseAnnotations");
const { lawArticleReferencesPlugin, createLawArticleResolver } = require("../docs/.vuepress/markdown/lawArticleReferences");

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), "just-laws-references-"));
test.after(() => fs.rmSync(fixture, {recursive:true, force:true}));
function put(file, source) {
  const target = path.join(fixture, file);
  fs.mkdirSync(path.dirname(target), {recursive:true});
  fs.writeFileSync(target, source);
}
put("civil-and-commercial/sample/README.md", "# 中华人民共和国示例法\n\n**第一条**　依据本法第二条、第三条至第四条及第四条之一。\n\n**第二条**　二。\n\n**第三条**　三。\n\n**第四条**　四。\n\n第四条之一　五。");
put("civil-and-commercial/sample/versions/old/README.md", "# 中华人民共和国示例法\n\n**第一条**　依据本法第二条。\n\n**第二条**　旧版。");
put("civil-and-commercial/split/README.md", "# 中华人民共和国分编法");
put("civil-and-commercial/split/01-general.md", "# 第一编 总则\n\n**第一条**　依照本法第二条。");
put("civil-and-commercial/split/02-special.md", "# 第二编 分则\n\n**第二条**　依照本法第一条。");
put("civil-and-commercial/split/decision.md", "# 另一个决定\n\n**第一条**　依照本决定第二条。\n\n**第二条**　决定正文。");
put("civil-and-commercial/split/03-amendment.md", "# 修正案\n\n**第一条**　依照第二条。");
put("category/example.md", "# 分类\n\n**第一条**　依照第二条。\n\n**第二条**　二。");
const md = new MarkdownIt({html:true}).use(lawArticleAnchorsPlugin).use(lawArticleReferencesPlugin, {docsDir:fixture});
function render(file, source) {
  return md.render(source ?? fs.readFileSync(path.join(fixture,file),"utf8"), {filePathRelative:file});
}
const sample = "civil-and-commercial/sample/README.md";

test("单文件法支持并列、范围与之一条号，条首提供直达链接", () => {
  const html = render(sample);
  assert.match(html, /<strong><a href="\.\/README.md#article-1" class="law-article-permalink"[^>]*>第一条<\/a><\/strong>/);
  assert.equal((html.match(/law-article-permalink/g)||[]).length,5);
  for(const id of ["2","3","4","4-1"]) assert.ok(html.includes(`href="./README.md#article-${id}"`));
  assert.equal((html.match(/law-article-reference/g)||[]).length,4);
});
test("跨分编互相跳转，不受同目录的其他决定或修正案污染", () => {
  assert.ok(render("civil-and-commercial/split/01-general.md").includes('href="./02-special.md#article-2"'));
  assert.ok(render("civil-and-commercial/split/02-special.md").includes('href="./01-general.md#article-1"'));
  assert.ok(render("civil-and-commercial/split/decision.md").includes('href="./decision.md#article-2"'));
  assert.doesNotMatch(render("civil-and-commercial/split/03-amendment.md"), /law-article-reference/);
});
test("历史版本只解析本版本，不借用现行版才有的条号", () => {
  const file="civil-and-commercial/sample/versions/old/README.md";
  const html=render(file, fs.readFileSync(path.join(fixture,file),"utf8").replace("本法第二条", "本法第二条、第四条"));
  assert.ok(html.includes('href="./README.md#article-2"'));
  assert.doesNotMatch(html, /href="[^"]*article-4/);
});
test("不把其他法律、代码及已有链接误转成本法", () => {
  const text="# 中华人民共和国示例法\n\n**第一条**　依据《民事诉讼法》第二条至第三条、本法第四条。\n\n依照刑法第二条、第三条。依照本法第二条。\n\n[第二条](#existing) `第三条` <a href='#existing'>第四条</a>\n\n**第二条**　二。\n\n**第三条**　三。\n\n**第四条**　四。";
  const html=render(sample,text);
  assert.equal((html.match(/law-article-reference/g)||[]).length,2);
  assert.match(html, /《民事诉讼法》第二条至第三条/);
  assert.match(html, /刑法第二条、第三条/);
});
test("重复条号、未知条号不猜测，分类页不应用", () => {
  const html=render(sample,"# 示例法\n\n**第一条**　依据第二条、第九百条。\n\n**第二条**　二。\n\n**第二条**　另一个二。");
  assert.doesNotMatch(html,/law-article-reference/);
  assert.doesNotMatch(render("category/example.md"),/law-article-reference/);
});
test("正文热更新后立即识别新增目标条号", () => {
  const base="# 示例法\n\n**第一条**　依据第二条。";
  assert.doesNotMatch(render(sample,base),/law-article-reference/);
  assert.match(render(sample,base+"\n\n**第二条**　新增。"),/law-article-reference/);
});

const realMd = new MarkdownIt().use(lawArticleAnchorsPlugin).use(criminalOffenseAnnotationsPlugin).use(lawArticleReferencesPlugin);
test("刑法总则、分则共同适用，罪名和正文保持不变", () => {
  for(const name of ["01-general-provisions", "02-specific-provisions"]) {
    const file=`criminal-law/criminal-law/${name}.md`;
    const source=fs.readFileSync(`docs/${file}`,"utf8");
    const before=new MarkdownIt().use(lawArticleAnchorsPlugin).use(criminalOffenseAnnotationsPlugin).render(source,{filePathRelative:file});
    const after=realMd.render(source,{filePathRelative:file});
    assert.equal(after.replace(/<a [^>]*class="law-article-(?:reference|permalink)"[^>]*>([^<]*)<\/a>/g,'$1'),before);
    assert.match(after,/law-article-reference/);
  }
});
test("真实民法典支持跨编，商标法未来版和现行版目录隔离", () => {
  const resolver=createLawArticleResolver();
  const civil="civil-and-commercial/civil-code/02-property-rights.md";
  const ctx=resolver.resolve({filePathRelative:civil},fs.readFileSync(`docs/${civil}`,"utf8"));
  assert.ok(ctx.targets.get('article-1').includes('01-general-principles.md'));
  for(const file of ["civil-and-commercial/trademark-law/README.md", "civil-and-commercial/trademark-law/versions/2027-01-01/README.md"]) {
    const version=resolver.resolve({filePathRelative:file},fs.readFileSync(`docs/${file}`,"utf8"));
    assert.equal(version.targets.get('article-1'),'./README.md#article-1');
  }
});

test("全站生成的援引链接均有真实目标，且不修改正文或段落", () => {
  const docsDir=path.resolve(__dirname,"../docs");
  const sections=["constitution","constitutional-relevance","civil-and-commercial","administrative","economic","social","criminal-law","procedural","ecological-environment"];
  const files=[];
  function walk(dir) {
    for(const entry of fs.readdirSync(dir,{withFileTypes:true})) {
      const file=path.join(dir,entry.name);
      if(entry.isDirectory()) walk(file);
      else if(entry.name.endsWith('.md')) files.push(file);
    }
  }
  sections.forEach(section=>walk(path.join(docsDir,section)));
  const plainMd=new MarkdownIt().use(lawArticleAnchorsPlugin).use(criminalOffenseAnnotationsPlugin);
  const anchors=new Map();
  let linkCount=0, linkedPages=0;
  for(const file of files) {
    const env={filePath:file};
    const source=fs.readFileSync(file,'utf8');
    const html=plainMd.render(source,env);
    anchors.set(file,new Set([...html.matchAll(/id="(article-[^"]+)"/g)].map(m=>m[1])));
    const linked=realMd.render(source,env);
    assert.equal(linked.replace(/<a [^>]*class="law-article-(?:reference|permalink)"[^>]*>([^<]*)<\/a>/g,'$1'),html,file);
    const links=[...linked.matchAll(/<a href="([^"]+)" class="law-article-reference"/g)].map(m=>m[1]);
    if(links.length) linkedPages++;
    for(const href of links) {
      linkCount++;
      const [target,anchor]=href.split('#');
      const targetFile=path.resolve(path.dirname(file),target);
      assert.equal(path.dirname(targetFile),path.dirname(file),`跨版本链接 ${file}: ${href}`);
      if(!anchors.has(targetFile)) {
        const targetHtml=plainMd.render(fs.readFileSync(targetFile,'utf8'),{filePath:targetFile});
        anchors.set(targetFile,new Set([...targetHtml.matchAll(/id="(article-[^"]+)"/g)].map(m=>m[1])));
      }
      assert.ok(anchors.get(targetFile).has(anchor),`无目标 ${file}: ${href}`);
    }
  }
  assert.ok(linkCount>1000);
  console.log(`全站援引检查：${files.length} 个页面，${linkedPages} 个页面有链接，共 ${linkCount} 处有效跳转。`);
});
