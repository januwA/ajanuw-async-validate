import { AsyncValidate } from "../src";

describe("main", () => {
  it("test validate", async () => {
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
      function ({ name, message }) {
        expect(name).toBe("pwd2");
        expect(message).toBe("两次密码填写不一样");
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
        name: "ajanuw",
        pwd: "12345678",
        pwd2: "12345677",
      })
    ).toBe(false);
  });

  it("test max", async () => {
    const av = new AsyncValidate({
      value: [AsyncValidate.max(10, "不能超过10")],
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
      value: [AsyncValidate.min(10, "不能小于10")],
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
});
