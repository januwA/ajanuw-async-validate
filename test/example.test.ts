import { AsyncValidate, Validators } from "../src";

describe("example", () => {
  it("test validate", async () => {
    const av = new AsyncValidate({
      name: [
        Validators.required("名称必填"),
        Validators.minLength(6, "姓名最少需要6个字符"),
        // custom validate
        (name: string) => {
          const err = name === "ajanuw" ? null : { checkName: "name error." };
          return Promise.resolve(err);
        },
      ],
      pwd: [
        Validators.required("密码必填"),
        Validators.minLength(8, "密码最少需要8个字符"),
      ],

      pwd2: [
        Validators.required("填写确认密码"),
        // custom validate
        (input, data) =>
          input !== data.pwd ? { checkPwd: "两次密码填写不一样" } : null,
      ],
      address: new AsyncValidate({
        code: Validators.required(),
        zip: Validators.required("zip 必填"),
        remark: Validators.maxLength(100, "备注不能大于100个字符"),
      }),
      array: [
        Validators.maxLength(10, "array 长度不能大于10"),
        (value, data) => {
          for (const el of value) {
            // valied item
          }

          return null;
        },
      ],
    });

    const result = await av.validate(
      {
        name: "aja",
        pwd: "12345678",
        pwd2: "",
        address: {
          code: "",
          zip: "",
          remark: "",
        },
        array: [1, 2, 3, 4, 5],
        other: "", // 未定义验证器的字段，自动忽略验证
      },
      true
    );

    expect(result.valid).toBe(false);
    expect(result.invalid).toBe(true);

    expect(result.getError("minLength", "name")).toBe("姓名最少需要6个字符");
    expect(result.hasError("checkName", "name")).toBeTruthy();

    expect(result.hasError("required", "pwd2")).toBeTruthy();
    expect(result.hasError("checkPwd", "pwd2")).toBeTruthy();

    expect(result.getError("required", "address/code")).toBe(true); // 测试空的错误消息
    expect(result.getError("required", "address/zip")).toBe("zip 必填");
    expect(result.hasError("maxLength", "address/remark")).toBeFalsy();
  });
});
