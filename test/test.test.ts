import { AsyncValidate } from "../src";

describe("main", () => {
  it("test validate", async () => {
    function checkName(name: string) {
      return new Promise((res) => {
        setTimeout(() => {
          if (name === "ajanuw") {
            res(null);
          } else {
            res({ checkName: "检测名称失败" });
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
            checkName,
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

    expect(
      await av.validate({
        name: "ajanuw",
        pwd: "12345678",
        pwd2: "12345678",
      })
    ).toBe(true);

    expect(
      await av.validate({
        name: "aja",
        pwd: "12345678",
        pwd2: "",
      })
    ).toBe(false);
  });

  it("test skip validate", async () => {
    const av = new AsyncValidate({
      name: null,
      age: [],
    });

    expect(
      await av.validate({
        name: "x",
        age: "",
      })
    ).toBe(true);
  });

  it("test oneError", async () => {
    const av = new AsyncValidate(
      {
        name: {
          required: "name is required!",
        },
      },
      {
        fail(er) {
          expect(AsyncValidate.oneError(er)).toBe("name is required!");
        },
      }
    );

    const r = await av.validate({
      name: "",
    });
    expect(r).toBe(false);
  });

  it("test max", async () => {
    const av = new AsyncValidate({
      value: AsyncValidate.max(10, "不能超过10"),
    });
    expect(
      await av.validate({
        value: 9,
      })
    ).toBe(true);

    expect(
      await av.validate({
        value: 11,
      })
    ).toBe(false);
  });

  it("test min", async () => {
    const av = new AsyncValidate({
      value: {
        min: [10, "不能小于10"],
      },
    });
    expect(
      await av.validate({
        value: 9,
      })
    ).toBe(false);

    expect(
      await av.validate({
        value: 11,
      })
    ).toBe(true);
  });

  it("test hex", async () => {
    const av = new AsyncValidate({
      a: AsyncValidate.hex("value is not a hex"),
      b: AsyncValidate.hex("value is not a hex"),
      c: AsyncValidate.hex("value is not a hex"),
      d: AsyncValidate.hex("value is not a hex"),
      e: AsyncValidate.hex("value is not a hex"),
    });
    expect(
      await av.validate({
        a: "0x0A",
        b: "0Ah",
        c: "0A",
        d: "0X0A",
        e: "0AH",
      })
    ).toBe(true);
  });

  it("test number", async () => {
    const av = new AsyncValidate({
      a: AsyncValidate.number("value is not a number"),
    });
    expect(
      await av.validate({
        a: 10,
      })
    ).toBe(true);
    expect(
      await av.validate({
        a: 1 / 0,
      })
    ).toBe(false);

    expect(
      await av.validate({
        a: 0 / 0,
      })
    ).toBe(false);
  });

  it("test int", async () => {
    const av = new AsyncValidate({
      a: AsyncValidate.int("value is not a int"),
    });
    expect(
      await av.validate({
        a: 10,
      })
    ).toBe(true);
    expect(
      await av.validate({
        a: 1 / 0,
      })
    ).toBe(false);

    expect(
      await av.validate({
        a: 0 / 0,
      })
    ).toBe(false);

    expect(
      await av.validate({
        a: 1.2,
      })
    ).toBe(false);
  });

  it("test float", async () => {
    const av = new AsyncValidate({
      a: AsyncValidate.float("value is not a float"),
    });
    expect(
      await av.validate({
        a: 10,
      })
    ).toBe(false);

    expect(
      await av.validate({
        a: 1 / 0,
      })
    ).toBe(false);

    expect(
      await av.validate({
        a: 0 / 0,
      })
    ).toBe(false);

    expect(
      await av.validate({
        a: 1.2,
      })
    ).toBe(true);
  });

  it("test array", async () => {
    const av = new AsyncValidate({
      a: AsyncValidate.array("value is not a array"),
    });
    expect(
      await av.validate({
        a: [],
      })
    ).toBe(true);

    expect(
      await av.validate({
        a: 1,
      })
    ).toBe(false);
  });

  it("test object", async () => {
    const av = new AsyncValidate({
      a: AsyncValidate.object("value is not a object"),
    });
    expect(
      await av.validate({
        a: {},
      })
    ).toBe(true);

    expect(
      await av.validate({
        a: [],
      })
    ).toBe(false);

    const av2 = new AsyncValidate(
      {
        name: AsyncValidate.required("name is requries!"),
        address: {
          object: "address error.",
          validators: new AsyncValidate(
            {
              street: {
                required: "require street.",
              },
              zip: {
                required: "require street.",
              },
            },
            { checkAll: true }
          ),
        },
      },
      {
        fail: function (erFields) {
          expect(erFields.street).toBeTruthy();
          expect(erFields.street.errors.required).toBeTruthy();

          expect(erFields.zip).toBeTruthy();
          expect(erFields.zip.errors.required).toBeTruthy();
        },
      }
    );
    expect(
      await av2.validate({
        name: "ajanuw",
        address: {
          street: "",
          zip: "",
        },
      })
    ).toBe(false);
  });

  it("test json", async () => {
    const av = new AsyncValidate({
      a: { json: "value is not a json" },
    });
    expect(
      await av.validate({
        a: "{}",
      })
    ).toBe(true);

    expect(
      await av.validate({
        a: "[]",
      })
    ).toBe(true);

    expect(
      await av.validate({
        a: "['a']",
      })
    ).toBe(false);
  });

  it("test bool", async () => {
    const av = new AsyncValidate({
      a: { bool: "value is not a bool" },
      b: AsyncValidate.bool("value is not a bool"),
    });
    expect(
      await av.validate({
        a: true,
        b: false,
      })
    ).toBe(true);

    expect(
      await av.validate({
        a: 1,
        b: "",
      })
    ).toBe(false);
  });

  it("test regexp", async () => {
    const av = new AsyncValidate({
      a: { regexp: "value is not a regexp" },
      b: AsyncValidate.regexp("value is not a regexp"),
    });
    expect(
      await av.validate({
        a: /a/,
        b: new RegExp(""),
      })
    ).toBe(true);

    expect(
      await av.validate({
        a: 1,
        b: "",
      })
    ).toBe(false);
  });

  it("test fail", async () => {
    const av = new AsyncValidate({
      value: {
        hex: "value is not a hex",
        minLength: [12, "error."],
        fail(er) {
          expect(er.errors.hex).toBeTruthy();
          expect(er.errors.minLength).toBeTruthy();
        },
      },
      name: {
        required: "name is required",
        fail(er) {
          console.log(er);
        },
      },
    });
    expect(
      await av.validate({
        value: "0xhello",
        name: "ajanuw",
      })
    ).toBe(false);
  });
});

describe("mixin", () => {
  beforeAll(() => {
    AsyncValidate.mixin({
      enum(c: any[], msg: string) {
        return (input) => {
          if (!c.includes(input)) return { enum: msg };
        };
      },
    });
  });

  it("test mixin", async () => {
    const av = new AsyncValidate({
      value: {
        enum: [["a", "b", "c"], "error."],
      },
    });
    expect(await av.validate({ value: "a" })).toBe(true);
    expect(await av.validate({ value: "d" })).toBe(false);
  });
});
