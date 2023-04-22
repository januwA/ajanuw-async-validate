## ajanuw-async-validate

Asynchronous form validator

## install
```sh
$ npm i ajanuw-async-validate
```

## Use
```ts
import { AsyncValidate, Validators } from "ajanuw-async-validate";

// Create an asynchronous validator
const av = new AsyncValidate(
  {
    name: {
      required: "name is required",
      validators: [
        Validators.minLength(6, "姓名最少需要6个字符"),

        // Custom validator
        (name:string, data:any) => Promise.resolve( name === 'ajanuw' ? null : { checkName: "name error." } )
      ],
    },

    pwd: {
      required: "密码必填",
      minLength: [8, "密码最少需要8个字符"],
    },

    pwd2: {
      required: "填写确认密码",
      validators: (input, data) => input !== data.pwd ? { checkPwd: "两次密码填写不一样" } : null
      },
    }
);

// Verify the data, if all are successful, it will return "true", otherwise it will return "false"

await av.validate({
  name: "aja",
  pwd: "12345678",
  pwd2: "",
}) // false
```


## Set field validator
```ts
// Set up a single
new AsyncValidate({
  name: Validators.required("name is required!"),
});

// Set multiple
new AsyncValidate({
  name: [ Validators.required("name is required!") ],
});

// Can also be like this
new AsyncValidate({
  name: {
    required: "name is required!"
  }
})

// Set to "Ignore" to skip the verification of this field
new AsyncValidate({
  name: Validators.Ignore,
})


// Verify Object value
const av = new AsyncValidate(
  {
    name: Validators.required("name is requries!"),
    address: {
      object: "address error.",
      children: {
          street: {
            required: "require street.",
          },
          zip: {
            required: "require street.",
          },
        },
    },
  },
);

await av.validate({
    name: "ajanuw",
    address: {
      street: "",
      zip: "",
    },
})
```


## Use "mixin" to define a global validator
```ts
Validators.mixin({
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

await av.validate({ value: "a" }) // true
await av.validate({ value: "d" }) // false
```


## Set error handling for all validators
```ts
import { AsyncValidate } from "ajanuw-async-validate";

AsyncValidate.fail = (erFields) => {
 //...
}
```

## Get the first error string
```ts
AsyncValidate.fail = (erFields) => {
 AsyncValidate.firstError(erFields) // first error string
}
```

## Use on the browser
```html
<script src="ajanuw-async-validate.js"></script>
<script>
  const { AsyncValidate } = window.AjanuwAsyncValidate;

  const av = new AsyncValidate(
    {
      username: {
        required: "请填写用户名!",
        fail(er) {
          // 字段验证失败结果:  ['请填写用户名!']
          console.log("字段验证失败结果: ", Object.values(er.errors));
        },
      },
      password: {
        required: "请填写密码!",
      },
    },
    {
      fail(er) {
        // 表单验证失败结果:  请填写用户名!
        console.log("表单验证失败结果: ", AsyncValidate.firstError(er));
      },
    }
  );

  (async () => {
    const data = {
      username: "",
      password: "",
    };
    const valid = await av.validate(data);
    console.log("valid: ", valid); // false
  })();
</script>
```


## And
```ts
const av = new AV({
  x: {
    required: "必填",
    or: [
      [Validators.number(), Validators.and([Validators.string(), Validators.hex()])],
      "必须为数字或则字符串!",
    ],
  },
});

expect(await av.validate({ x: 123 }))   .toBe(true);
expect(await av.validate({ x: "0x01" })).toBe(true);
expect(await av.validate({ x: true }))  .toBe(false);
```

## Or
```ts
const av = new AV({
  x: {
    required: "必填",
    or: [[Validators.number(), Validators.string()], "必须为数字或则字符串!"],
  },
});

expect(await av.validate({ x: 123 })).toBe(true);
expect(await av.validate({ x: "123" })).toBe(true);
expect(await av.validate({ x: true })).toBe(false);
```

More features, [please see the test](https://github.com/januwA/ajanuw-async-validate/blob/main/test/test.test.ts)

## build
> $ npm run build

## test
> $ npm t