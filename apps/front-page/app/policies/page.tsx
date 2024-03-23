import ExternalLink from "components/ExternalLink";

export default function Page() {
  return (
    <div className="container min-h-screen max-w-screen-sm bg-white py-32">
      <h1 className="title-text mb-24 text-center">Policies</h1>
      <ul className="list-none">
        <li className="my-2">
          <ExternalLink href="https://docs.google.com/document/u/1/d/e/2PACX-1vRCEdAbIF8iwRrik54Ka_FpOCaO2DLRAgPiaLHUXlJoMVmkguOqdoc0C3rvgwG_vkixzG7XPKY3VFz1/pub#h.w3wa3of6nuhg">
            Terms And Conditions
          </ExternalLink>
        </li>
        <li className="my-2">
          <ExternalLink href="https://docs.google.com/document/u/1/d/e/2PACX-1vRCEdAbIF8iwRrik54Ka_FpOCaO2DLRAgPiaLHUXlJoMVmkguOqdoc0C3rvgwG_vkixzG7XPKY3VFz1/pub#h.66xkb0x63zyn">
            Privacy Policy
          </ExternalLink>
        </li>
        <li className="my-2">
          <ExternalLink href="https://14trees.notion.site/14-Trees-Foundation-Policies-11fffaa9fd5f4a249dab45d3a3172951">
            Financial and Legal
          </ExternalLink>
        </li>
        <li className="my-2">
          <ExternalLink href="https://14trees.notion.site/14-Trees-Foundation-Policies-11fffaa9fd5f4a249dab45d3a3172951">
            Anti-Fraud
          </ExternalLink>
        </li>
        <li className="my-2">
          <ExternalLink href="https://14trees.notion.site/14-Trees-Foundation-Policies-11fffaa9fd5f4a249dab45d3a3172951">
            Anti-Bribery
          </ExternalLink>
        </li>
        <li className="my-2">
          <ExternalLink href="https://14trees.notion.site/14-Trees-Foundation-Policies-11fffaa9fd5f4a249dab45d3a3172951">
            Anti-Corruption
          </ExternalLink>
        </li>
        <li className="my-2">
          <ExternalLink href="https://14trees.notion.site/14-Trees-Foundation-Policies-11fffaa9fd5f4a249dab45d3a3172951">
            Child Protection
          </ExternalLink>
        </li>
      </ul>
    </div>
  );
}
