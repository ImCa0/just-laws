#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
AI辅助法律批量处理工具
帮助快速处理收录法律的辅助工作
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Optional

# 分类映射
CATEGORY_MAP = {
    "宪法相关法": "constitutional-relevance",
    "民商法": "civil-and-commercial",
    "行政法": "administrative",
    "经济法": "economic",
    "社会法": "social",
    "刑法": "criminal-law",
    "程序法": "procedural",
}

def load_category_mapping(laws_list_path: str) -> Dict[str, str]:
    """加载法律分类映射"""
    print(f"正在加载法律分类信息: {laws_list_path}")
    with open(laws_list_path, 'r', encoding='utf-8') as f:
        content = f.read()

    mapping = {}
    current_category = None

    for line in content.split('\n'):
        category_match = re.match(r'## (.+?)（\d+件）', line)
        if category_match:
            current_category = category_match.group(1)
            continue

        law_match = re.match(r'\d+\. (.+?)（', line)
        if law_match and current_category:
            law_name = law_match.group(1)
            mapping[law_name] = current_category

    print(f"已加载 {len(mapping)} 个法律的分类信息")
    return mapping

def get_law_info(md_file: Path, category_mapping: Dict[str, str]) -> Optional[dict]:
    """获取法律信息"""
    # 提取法律名称（去掉日期）
    base_name = md_file.stem
    law_name = re.sub(r'_\d{8}$', '', base_name)

    # 获取分类
    category = category_mapping.get(law_name)

    if not category:
        return None

    return {
        'law_name': law_name,
        'category': category,
        'category_dir': CATEGORY_MAP.get(category),
        'md_file': str(md_file),
        'english_name': translate_to_english(law_name),
    }

def translate_to_english(law_name: str) -> str:
    """翻译为英文目录名"""
    # 简化版翻译（可以扩展）
    translations = {
        '反分裂国家法': 'anti-secession-law',
        '专属经济区和大陆架法': 'exclusive-economic-zone-and-continental-shelf-law',
        '外国中央银行财产司法强制措施豁免法': 'immunity-from-judicial-enforcement-measures-for-foreign-central-banks',
        # 可以添加更多翻译...
    }

    # 移除"中华人民共和国"
    short_name = law_name.replace("中华人民共和国", "")

    if short_name in translations:
        return translations[short_name]

    # 简化处理
    return short_name.lower().replace(" ", "-").replace("（", "").replace("）", "").replace("、", "-")

def check_included(law_name: str, config_path: str) -> bool:
    """检查是否已收录"""
    with open(config_path, 'r', encoding='utf-8') as f:
        content = f.read()

    short_name = law_name.replace("中华人民共和国", "")
    return short_name in content

def generate_processing_plan(md_files: List[Path], laws_list_path: str,
                             config_path: str, max_count: int = 50) -> List[dict]:
    """生成处理计划"""
    category_mapping = load_category_mapping(laws_list_path)

    plan = []
    included_count = 0

    for md_file in md_files:
        if included_count >= max_count:
            break

        info = get_law_info(md_file, category_mapping)

        # 只处理分类明确的文件
        if info and info['category'] and info['category_dir']:
            if not check_included(info['law_name'], config_path):
                plan.append(info)
                included_count += 1

    return plan

def main():
    """主函数"""
    md_dir = Path('.temp/laws_md')
    md_files = sorted(md_dir.glob('*.md'))

    print(f"共找到 {len(md_files)} 个MD文件")

    # 生成处理计划（前50个未收录的法律）
    plan = generate_processing_plan(md_files, '.temp/laws-list.md',
                                    'docs/.vuepress/config.js', max_count=50)

    print(f"\n计划处理 {len(plan)} 部法律:\n")

    for i, info in enumerate(plan, 1):
        print(f"{i}. {info['law_name']}")
        print(f"   分类: {info['category']} -> {info['category_dir']}")
        print(f"   英文: {info['english_name']}")
        print(f"   源文件: {info['md_file']}")
        print()

    # 保存处理计划到JSON文件
    with open('processing_plan.json', 'w', encoding='utf-8') as f:
        json.dump(plan, f, ensure_ascii=False, indent=2)

    print(f"处理计划已保存到 processing_plan.json")

if __name__ == "__main__":
    main()
