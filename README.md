# 集团看板 · 移动端 Demo

集团、市场、门店三级经营看板。全部使用模拟数据，未连接业务系统。

支持单月与累计月份查询、最近 12 个月趋势、曲线点击数值提示、门店指标排序，以及手机横竖屏布局。

## 本地运行

```sh
python3 -m http.server 8766 --directory dist
```

打开 http://localhost:8766/。

## 验证

```sh
node tests/data.test.cjs
node tests/routes.test.cjs
node tests/trend-tooltip.test.cjs
```

## GitHub Pages

在仓库 Settings → Pages 中选择 Deploy from a branch，分支 main，目录 /docs，保存。

页面源码位于 dist。更新后将 dist 中的四个文件同步至 docs，再提交。
