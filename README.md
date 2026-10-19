# 集团看板 · 移动端 Demo

集团、市场、门店三级经营看板。全部使用模拟数据，未连接业务系统。

支持单月、月度累计及年度累计查询，选择后自动更新；年度默认累计上年度至当前年度（截至上月）。支持最近 12 个月／所选年度趋势、点击读数、市场对比和门店指标排序。

IPO 核心指标为门店数、翻台率、收入、利润额、收入增长率和利润增速；2026 年 9 月末模拟在营门店 499 家。管理数据按含税口径计算毛利率、食材成本率、人工成本率与利润率。首页及穿透页展示环比、同比。

## 本地运行

```sh
python3 -m http.server 8766 --directory dist
```

打开 http://localhost:8766/。

## 验证

```sh
node --test tests/*.test.cjs
```

## GitHub Pages

访问：https://raoxiaoying.github.io/group_dashboard/

在仓库 Settings → Pages 中选择 Deploy from a branch，分支 main，目录 /docs。

页面源码位于 dist。更新后将 dist 中的四个文件同步至 docs，再提交。Quick BI 实施说明见 QUICKBI_IMPLEMENTATION.html。
