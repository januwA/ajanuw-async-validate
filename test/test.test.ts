import { AsyncValidate as AV, Validators, firstErrorMsg } from "../src";

describe("main", () => {
  it("test firstErrorMsg", async () => {
    const av = new AV({
      name: Validators.required("name is required"),
    });

    const r = await av.validate({ name: "" });
    expect(r.valid).toBe(false);
    expect(firstErrorMsg(r)).toBe("name is required");
  });
});

describe("Validators", () => {
  it("test required", async () => {
    const f = Validators.required();
    expect(f("123", {})).toBeFalsy();
    expect(f([1, 2, 3], {})).toBeFalsy();

    expect(f("", {})).toBeTruthy();
    expect(f(false, {})).toBeTruthy();
  });

  it("test len", async () => {
    const f = Validators.len(3);
    expect(f("123", {})).toBeFalsy();
    expect(f([1, 2, 3], {})).toBeFalsy();

    expect(f("12", {})).toBeTruthy();
    expect(f([], {})).toBeTruthy();
  });

  it("test minLength", async () => {
    const f = Validators.minLength(3);
    expect(f("1234", {})).toBeFalsy();
    expect(f([1, 2, 3, 4], {})).toBeFalsy();

    expect(f("12", {})).toBeTruthy();
    expect(f([], {})).toBeTruthy();
  });

  it("test maxLength", async () => {
    const f = Validators.maxLength(3);
    expect(f("1234", {})).toBeTruthy();
    expect(f([1, 2, 3, 4], {})).toBeTruthy();

    expect(f("12", {})).toBeFalsy();
    expect(f([], {})).toBeFalsy();
  });

  it("test phone", async () => {
    const f = Validators.phone();
    expect(f("15281414666", {})).toBeFalsy();
    expect(f("+8615281414666", {})).toBeFalsy();
    expect(f("5281414666", {})).toBeTruthy();
  });

  it("test bool", async () => {
    const f = Validators.bool();
    expect(f(true, {})).toBeFalsy();
    expect(f(false, {})).toBeFalsy();
    expect(f(1, {})).toBeTruthy();
  });

  it("test email", async () => {
    const f = Validators.email();
    expect(f("asd@qq.com", {})).toBeFalsy();
    expect(f("foo@com", {})).toBeTruthy();
  });

  it("test max", async () => {
    const f = Validators.max(10);
    expect(f(9, {})).toBeFalsy();
    expect(f(11, {})).toBeTruthy();
  });

  it("test min", async () => {
    const f = Validators.min(10);
    expect(f(9, {})).toBeTruthy();
    expect(f(11, {})).toBeFalsy();
  });

  it("test hex", async () => {
    const f = Validators.hex();
    expect(f("0x0A", {})).toBeFalsy();
    expect(f("0Ah", {})).toBeFalsy();
    expect(f("0A", {})).toBeFalsy();
    expect(f("0AH", {})).toBeFalsy();
    expect(f("U123", {})).toBeTruthy();
  });

  it("test number", async () => {
    const f = Validators.number();
    expect(f(1.2, {})).toBeFalsy();
    expect(f(1, {})).toBeFalsy();
    expect(f(NaN, {})).toBeTruthy();
  });

  it("test int", async () => {
    const f = Validators.int();
    expect(f(1.2, {})).toBeTruthy();
    expect(f(0 / 0, {})).toBeTruthy();
    expect(f(1 / 0, {})).toBeTruthy();
    expect(f(1, {})).toBeFalsy();
  });

  it("test array", async () => {
    const f = Validators.array();
    expect(f([], {})).toBeFalsy();
    expect(f({}, {})).toBeTruthy();
  });

  it("test object", async () => {
    const f = Validators.object();
    expect(f({}, {})).toBeFalsy();
    expect(f([], {})).toBeTruthy();
  });

  it("test json", async () => {
    const f = Validators.json();
    expect(f("[]", {})).toBeFalsy();
    expect(f("{}", {})).toBeFalsy();

    // 不允许基元类型
    expect(f(`"asd"`, {})).toBeTruthy();
    expect(f("123", {})).toBeTruthy();
  });

  it("test regexp", async () => {
    const f = Validators.regexp();
    expect(f(/a/, {})).toBeFalsy();
    expect(f(new RegExp(""), {})).toBeFalsy();

    expect(f(1, {})).toBeTruthy();
  });

  it("test string", async () => {
    const f = Validators.string();
    expect(f("asd", {})).toBeFalsy();
    expect(f("", {})).toBeFalsy();

    expect(f(1, {})).toBeTruthy();
    expect(f(false, {})).toBeTruthy();
  });
});
