## ajanuw-async-validate

Asynchronous form validator

## install
```sh
$ npm i ajanuw-async-validate
```

## Use
```ts
import { AsyncValidate } from "ajanuw-async-validate";

// Custom field validation
function checkName(name: string) {
  return new Promise((res) => {
    setTimeout(() => {
      if (name === "ajanuw") {
        res(null);
      } else {
        res({ checkName: "name error." });
      }
    }, 1000);
  });
}

// Create an asynchronous validator
const av = new AsyncValidate(
  {
    name: {
      required: "name is required",
      validators: [
        AsyncValidate.minLength(6, "姓名最少需要6个字符"),

        // Asynchronous validation of the "name" field
        checkName,
      ],

      // When "name" verification fails, this "fail" function will be called
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
    // By default, it will return directly when the first error is detected
    checkAll: true,

    // You can handle all errors here
    // If this "fail" is set, "AsyncValidate.fail" will not be called
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

// Verify the data, if all are successful, it will return "true", otherwise it will return "false"
expect(
  await av.validate({
    name: "aja",
    pwd: "12345678",
    pwd2: "",
  })
).toBe(false);
```


## Set field validator
```ts
import { AsyncValidate } from "ajanuw-async-validate";

// Set up a single
new AsyncValidate({
  name: AsyncValidate.required("name is required!"),
});

// Set multiple
new AsyncValidate({
  name: [AsyncValidate.required("name is required!")],
});

// Can also be like this
new AsyncValidate({
  name: {
    required: "name is required!"
  }
})

// Set to "null" to skip the verification of this field
new AsyncValidate({
  name: null,
})


// Verify Object value
const av = new AsyncValidate(
  {
    name: AsyncValidate.required("name is requries!"),
    address: {
      object: "address error.",
      validators: {
          street: {
            required: "require street.",
          },
          zip: {
            required: "require street.",
          },
        },
    },
  },
  {
    fail(erFields) {
      console.log(erFields);
    },
  }
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
  regexp?: ValidateHandleArg; // /a/, new RegExp()
  required?: ValidateHandleArg;
  validators?: AsyncValidate | AsyncValidateHandle | AsyncValidateHandle[];
  fail?: (errors: { value: any; errors: AnyObject }) => void;
  [name: string]: any;
}
```

## Set error handling for all validators
```ts
import { AsyncValidate } from "ajanuw-async-validate";

AsyncValidate.fail = (erFields) => {
 //...
}
```

More features, [please see the test](https://github.com/januwA/ajanuw-async-validate/blob/main/test/test.test.ts)

## build
> $ npm run build

## test
> $ npm t