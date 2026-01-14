# Firebase 设置指南

## 概述

网站现已支持 Firebase Cloud Firestore，可以实现多人共享数据。按以下步骤配置即可。

## 步骤 1: 创建 Firebase 项目

1. 访问 [Firebase Console](https://console.firebase.google.com/)
2. 使用 Google 账户登录（如没有请先注册）
3. 点击 **"Create a project"** 或 **"Add project"**
4. 输入项目名称（例如：`card-gallery`）
5. 选择国家/地区
6. 点击 **"Create project"** 等待创建完成

## 步骤 2: 获取配置信息

1. 项目创建完成后，点击左侧菜单 **"Project Settings"**（齿轮图标）
2. 向下滚动找到 **"Your apps"** 部分
3. 点击 **"Web"** 图标 `</>` 来添加 Web 应用
4. 输入应用名称（例如：`Card Gallery`）
5. 点击 **"Register app"**
6. 复制出现的配置代码，你需要以下信息：
   - **API Key**（apiKey）
   - **Project ID**（projectId）

示例格式：
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};
```

## 步骤 3: 设置 Firestore 数据库

1. 在 Firebase Console 左侧菜单，点击 **"Firestore Database"**
2. 点击 **"Create database"**
3. 选择启动模式：**"Start in test mode"**（测试模式）
4. 选择数据库位置（建议选择离你最近的地区）
5. 点击 **"Enable"** 创建数据库

### ⚠️ 重要安全提示
测试模式允许任何人读写数据。对于生产环境，你应该设置适当的安全规则。暂时使用测试模式方便开发。

## 步骤 4: 在网站中配置

1. 打开网站：http://localhost:8000（或你的部署地址）
2. 点击右上角的 **"⚙️ 配置"** 按钮
3. 粘贴你的配置信息：
   - **API Key**：从 Firebase Console 复制
   - **Project ID**：从 Firebase Console 复制
   - **Database URL**：可选，保留空白
4. 点击 **"保存配置"**
5. 页面会自动连接到 Firebase

## 步骤 5: 验证连接

- 右上角的状态指示器会显示：
  - ✓ **已连接**（绿色）- 成功连接到 Firebase
  - **连接失败**（红色）- 配置有误或网络问题
  - **本地模式**（灰色）- 未配置 Firebase

## 添加卡片并验证共享

1. 点击 **"添加新卡片"**
2. 填写标题、描述和上传图片
3. 点击 **"保存卡片"**
4. 在另一个浏览器或设备打开同一链接
5. 你应该能看到刚才添加的卡片 ✓

## 故障排除

### 问题：显示 "Firebase 失败"

**可能原因：**
- API Key 错误 → 重新从 Firebase Console 复制
- Project ID 错误 → 检查拼写
- Firestore 未启用 → 按步骤 3 创建数据库

**解决方案：**
1. 打开浏览器开发者工具（F12）
2. 查看 Console 标签，查看具体错误信息
3. 重新检查配置，再次点击"配置"

### 问题：数据添加后看不到

- 检查网络连接
- 确认 Firestore 中确实有 `cards` collection
- 尝试刷新页面

### 问题：想要切换回本地存储

- 点击 **"⚙️ 配置"**
- 点击 **"使用本地存储"**
- 数据将保存在本地浏览器

## 安全建议

### 生产环境安全规则

如果要部署到生产环境，应修改 Firestore 安全规则。在 Firebase Console：

1. 点击 **"Firestore Database"**
2. 点击 **"Rules"** 标签
3. 修改规则（示例）：

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 仅允许认证用户读写
    match /cards/{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## 定价

Firebase 提供**免费层**（Spark Plan）：
- 每月 50,000 读操作
- 每月 20,000 写操作
- 对个人项目完全免费

超出限制后可升级到按使用量付费。

## 更多资源

- [Firebase 官方文档](https://firebase.google.com/docs)
- [Firestore 快速开始](https://firebase.google.com/docs/firestore/quickstart)
- [Web SDK 文档](https://firebase.google.com/docs/web/setup)

## 常见问题

**Q: 能否只让特定人看到数据？**  
A: 可以，需要配置 Firebase Authentication（身份验证）。当前版本暂不支持。

**Q: 能否导出我的所有数据？**  
A: 可以，在 Firebase Console 中可以导出数据。

**Q: 数据会永久保存吗？**  
A: 是的，数据保存在 Firebase Cloud Firestore 中，只要你的 Firebase 项目存在就会保留。

---

**需要帮助？** 查看浏览器开发者工具的 Console 标签了解具体错误信息。
