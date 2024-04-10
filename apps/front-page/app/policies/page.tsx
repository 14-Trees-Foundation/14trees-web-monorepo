import ExternalLink from "components/ExternalLink";
import labels from "~/assets/labels.json";

export default function Page() {
  return (
    <div className="container min-h-screen max-w-screen-sm bg-white py-32">
      <h1 className="title-text mb-24 text-center">Policies</h1>
      <ul className="list-none">
        { 
          labels.policies.map(({name, link}) => (
            <li key={name}>
              <ExternalLink href={link}>
                {name}
              </ExternalLink>
            </li>
          ))
        }
        {/* <li className="my-2">
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
        </li> */}
      </ul>
    </div>
  );
}
