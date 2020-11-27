## 一个简单的异步表单验证器

## install
```sh
$ npm i ajanuw-async-validate
```

## 使用
```ts
import { AsyncValidate } from "ajanuw-async-validate";

// 异步验证姓名函数
function checkName(name: string) {
  return new Promise((res) => {
    setTimeout(() => {
      if (name === "ajanuw") {
        res(true);
      } else {
        res(false);
      }
    }, 1000);
  });
}

// 创建一个异步验证器
const av = new AsyncValidate(
  {
    name: [
      AsyncValidate.required("名称必填"),
      AsyncValidate.minLength(6, "姓名最少需要6个字符"),
      async function (input) {
        if (!(await checkName(input as string))) return "检测名称失败";
      },
    ],
    pwd: [
      AsyncValidate.required("密码必填"),
      AsyncValidate.minLength(8, "密码最少需要8个字符"),
    ],
    pwd2: [
      AsyncValidate.required("填写确认密码"),
      function (input, data) {
        if (input !== data.pwd) return "两次密码填写不一样";
      },
    ],
  },
  function (msg) {
    // dialog(msg)
  }
);

// 验证数据，如果全部成功将返回true，否者将返回false
expect(
  await av.validate({
    name: "ajanuw",
    pwd: "12345678",
    pwd2: "12345678",
  })
).toBe(true);
```

## build
> $ npm run build

## test
> $ npm t