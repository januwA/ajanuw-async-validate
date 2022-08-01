import { AsyncValidate as AV } from "../src";

describe("main", () => {
  it("test and", async () => {
    const av = new AV({
      x: {
        required: "必填",
        or: [
          [AV.number(), AV.and([AV.string(), AV.hex()])],
          "必须为数字或则字符串!",
        ],
      },
    });

    expect(await av.validate({ x: 123 })).toBe(true);
    expect(await av.validate({ x: "0x01" })).toBe(true);
    expect(await av.validate({ x: true })).toBe(false);
  });

  it("test or", async () => {
    const av = new AV({
      x: {
        required: "必填",
        or: [[AV.number(), AV.string()], "必须为数字或则字符串!"],
      },
    });

    expect(await av.validate({ x: 123 })).toBe(true);
    expect(await av.validate({ x: "123" })).toBe(true);
    expect(await av.validate({ x: true })).toBe(false);
  });
  it("test empty data", async () => {
    const av = new AV({
      username: AV.required("名称必填!"),
    });

    expect(
      await av.validate({ username: "" }, (e) => {
        expect(e.username.errors.required).toBe("名称必填!");
      })
    ).toBe(false);
  });

  it("test skip validate", async () => {
    const av = new AV({
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

  it("test firstError", async () => {
    const av = new AV(
      {
        name: {
          required: "name is required!",
        },
      },
      {
        fail(er) {
          expect(AV.firstError(er)).toBe("name is required!");
        },
      }
    );
    expect(await av.validate({ name: undefined })).toBe(false);
  });

  it("test max", async () => {
    const av = new AV({
      value: AV.max(10, "不能超过10"),
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
    const av = new AV({
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
    const av = new AV({
      a: AV.hex("value is not a hex"),
      b: AV.hex("value is not a hex"),
      c: AV.hex("value is not a hex"),
      d: AV.hex("value is not a hex"),
      e: AV.hex("value is not a hex"),
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
    const av = new AV({
      a: AV.number("value is not a number"),
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
    const av = new AV({
      a: AV.int("value is not a int"),
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
    const av = new AV({
      a: AV.float("value is not a float"),
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
    const av = new AV({
      a: AV.array("value is not a array"),
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
    const av = new AV({
      a: AV.object("value is not a object"),
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

    const av2 = new AV(
      {
        name: AV.required("name is requries!"),
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
        checkAll: true,
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
    const av = new AV({
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
    const av = new AV({
      a: { bool: "value is not a bool" },
      b: AV.bool("value is not a bool"),
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
    const av = new AV({
      a: { regexp: "value is not a regexp" },
      b: AV.regexp("value is not a regexp"),
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
    const av = new AV({
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
    AV.mixin({
      enum(c: any[], msg: string) {
        return (input) => {
          if (!c.includes(input)) return { enum: msg };
        };
      },
    });
  });

  it("test mixin", async () => {
    const av = new AV({
      value: {
        enum: [["a", "b", "c"], "error."],
      },
      arr: {
        array: "必须是列表",
        validators: [
          (input: any[]) => {
            return [1, 2].every((e) => input.includes(e))
              ? null
              : { every: "必须包含 [1, 2]" };
          },
        ],
      },
    });
    expect(await av.validate({ value: "a", arr: [1, 2] })).toBe(true);
    expect(await av.validate({ value: "", arr: [3] })).toBe(false);
  });
});

describe("length", () => {
  it("test len", async () => {
    const av = new AV({
      value: {
        len: [3, "error."],
      },
    });
    expect(await av.validate({ value: "123" })).toBe(true);
    expect(await av.validate({ value: "12" })).toBe(false);
    expect(await av.validate({ value: "1234" })).toBe(false);
    expect(await av.validate({ value: 222 })).toBe(false);

    expect(await av.validate({ value: [] })).toBe(false);
    expect(await av.validate({ value: [1, 2, 3] })).toBe(true);
  });

  it("test minLength", async () => {
    const av = new AV({
      value: {
        minLength: [3, "error."],
      },
    });
    expect(await av.validate({ value: "123" })).toBe(true);
    expect(await av.validate({ value: "1234" })).toBe(true);
    expect(await av.validate({ value: "12" })).toBe(false);
    expect(await av.validate({ value: 222 })).toBe(false);

    expect(await av.validate({ value: [] })).toBe(false);
    expect(await av.validate({ value: [1, 2, 3] })).toBe(true);
    expect(await av.validate({ value: [1, 2, 3, 4] })).toBe(true);
  });

  it("test maxLength", async () => {
    const av = new AV({
      value: {
        maxLength: [3, "error."],
      },
    });
    expect(await av.validate({ value: "123" })).toBe(true);
    expect(await av.validate({ value: "12" })).toBe(true);
    expect(await av.validate({ value: "1234" })).toBe(false);
    expect(await av.validate({ value: 222 })).toBe(false);

    expect(await av.validate({ value: [] })).toBe(true);
    expect(await av.validate({ value: [1, 2, 3] })).toBe(true);
    expect(await av.validate({ value: [1, 2, 3, 4] })).toBe(false);
  });
});
