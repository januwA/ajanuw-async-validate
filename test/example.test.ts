import { AsyncValidate } from "../src";
describe("example", () => {
  it("test validate", async () => {
    const av = new AsyncValidate(
      {
        name: {
          required: "名称必填",
          validators: [
            AsyncValidate.minLength(6, "姓名最少需要6个字符"),

            (name: string) =>
              Promise.resolve(
                name === "ajanuw" ? null : { checkName: "name error." }
              ),
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
          validators: (input, data) =>
            input !== data.pwd ? { checkPwd: "两次密码填写不一样" } : null,
        },
      },
      {
        checkAll: true,
        ignore: false,
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
});
