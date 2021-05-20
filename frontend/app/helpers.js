export function isIntersecting(p1, p2, element) {
  /**
   * Input: two points, a rectangle element
   * Output: true if line segment joining p1 and p2 passes through element
   */

  const linearCombination = (p1, p2, lambda) => ({
    x: lambda * p1.x + (1 - lambda) * p2.x,
    y: lambda * p1.y + (1 - lambda) * p2.y,
  });

  const distance = (p1, p2) => (Math.sqrt(Math.pow(p1.x - p2.x, 2) +
      Math.pow(p1.y - p2.y, 2)));

  /**
   * Calculate the number of points to choose b/w the mouse points
   * for intersection. Taking 50 points for every 1000px distance.
   */
  const npoints = (50 / 1000) * distance(p1, p2);

  for(let lambda=0; lambda <= 1; lambda += 1/npoints) {
    let p = linearCombination(p1, p2, lambda);
    if (element.contains(p.x, p.y))
      return true;
  }

  return false;
}
