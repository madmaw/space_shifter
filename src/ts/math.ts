type Vector2 = [number, number];

type Matrix2D = [
    number, number, number,
    number, number, number,
];

const matrix2DMultiplyArray = (a: Matrix2D[]) => a.slice(1).reduce(
    (
        [a0, a1, a2, a3, a4, a5]: Matrix2D, 
        [b0, b1, b2, b3, b4, b5]: Matrix2D,
    ) => [
        a0 * b0 + a2 * b1,
        a1 * b0 + a3 * b1,
        a0 * b2 + a2 * b3,
        a1 * b2 + a3 * b3,
        a0 * b4 + a2 * b5 + a4,
        a1 * b4 + a3 * b5 + a5,
    ], 
    a[0]) as Matrix2D;

function vector2TransformMatrix2D([x, y]: Vector2, [m0, m1, m2, m3, m4, m5]: Matrix2D): Vector2 {
    return [
        m0 * x + m2 * y + m4,
        m1 * x + m3 * y + m5,
    ];
}
