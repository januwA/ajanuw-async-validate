## 一个简单的异步表单验证器

## install
```sh
$ npm i ajanuw-async-validate
```

## 使用
```ts
import { AsyncValidate } from "ajanuw-async-validate";

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

const av = new AsyncValidate(
  {
    name: {
      required: "名称必填",
      validators: [
        AsyncValidate.minLength(6, "姓名最少需要6个字符"),
        async function (input) {
          if (!(await checkName(input as string)))
            return { checkName: "检测名称失败" };
        },
      ],
      fail(er) {
        expect(er.errors.minLength).toBe("姓名最少需要6个字符");
        expect(er.errors.checkName).toBeTruthy();
      },
    },
    pwd: {
      required: "密码必填",
      minLength: [8, "密码最少需要8个字符"],
    },
    pwd2: {
      required: "填写确认密码",
      validators: function (input, data) {
        if (input !== data.pwd) return { checkPwd: "两次密码填写不一样" };
      },
    },
  },
  {
    checkAll: true,
    fail: function (erFields) {
      expect("name" in erFields).toBe(true);
      expect(erFields.name.errors.minLength).toBe("姓名最少需要6个字符");
      expect(erFields.name.errors.checkName).toBeTruthy();

      expect("pwd2" in erFields).toBe(true);
      expect(erFields.pwd2.errors.required).toBeTruthy();
      expect(erFields.pwd2.errors.checkPwd).toBeTruthy();
    },
  }
);

// 验证数据，如果全部成功将返回true，否者将返回false
expect(
  await av.validate({
    name: "aja",
    pwd: "12345678",
    pwd2: "",
  })
).toBe(false);
```


## mixin 定义全局的验证器
```ts
AsyncValidate.mixin({
  enum(c: any[], msg: string) {
    return (input) => {
      if (!c.includes(input)) return { enum: msg };
    };
  },
});

const av = new AsyncValidate({
  value: {
    enum: [["a", "b", "c"], "error."],
  },
});

expect(await av.validate({ value: "a" })).toBe(true);
expect(await av.validate({ value: "d" })).toBe(false);
```



## AsyncValidateOptions
```ts
/**
 * 如果需要传递多个参数，那么数组最后一个应该是error message
 */
type ValidateHandleArg = string | any[];

interface AsyncValidateOptions {
  string?: ValidateHandleArg;
  number?: ValidateHandleArg;
  bool?: ValidateHandleArg;
  float?: ValidateHandleArg;
  int?: ValidateHandleArg; // Number.isSafeInteger()
  object?: ValidateHandleArg; // "[object Object]"
  array?: ValidateHandleArg; // Array.isArray()
  json?: ValidateHandleArg; // try JSON.parse()
  email?: ValidateHandleArg;
  hex?: ValidateHandleArg; // 0x0A 0Ah 0A
  regexp?: ValidateHandleArg; // /a/ new RegExp()

  required?: ValidateHandleArg;
  validators?: AsyncValidate | AsyncValidateHandle | AsyncValidateHandle[];

  // 监听单个字段的错误,当验证失败(invalid)时，调用
  fail?: (errors: { value: any; errors: AnyObject }) => void;

  [name: string]: any;
}
```

更多功能[请看测试](https://github.com/januwA/ajanuw-async-validate/blob/main/test/test.test.ts)

## build
> $ npm run build

## test
> $ npm t