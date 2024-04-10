import React from "react";
import Nav from "react-bootstrap/Nav";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Tooltip from "react-bootstrap/Tooltip";

const ProgressBar = () => {
  const clusterClick = () => {
    console.log("Cluster clicked");
  };

  const graphClick = () => {
    console.log("Graph clicked");
  };

  const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

  interface ITooltips {
    id: string;
    children: string;
    title: string;
  }

  const Tooltips = ({ id, children, title }: ITooltips) => (
    <OverlayTrigger
      placement="right"
      overlay={<Tooltip id={id}>{title}</Tooltip>}
    >
      <a href="#">{children}</a>
    </OverlayTrigger>
  );

  return (
    <div>
      <Nav
        variant="tabs"
        defaultActiveKey="/"
        justify
        className="p-3 text-primary-emphasis bg-primary-subtle border border-primary-subtle rounded-3"
      >
        <Nav.Item>
          <Nav.Link onClick={clusterClick}>
            Cluster Goals / Arrange into Hierarchy
            <Tooltips
              title="• Click the goal and use <strong><code>[delete]</code></strong> to delete a goal <br/>
                    • Click the last goal on the goal list and use <strong><code>[return]</code></strong> to generate a new goal <br/>
                    • Drag the goal from the goal list on the left section and drop it into the cluster on the right section<br/>
                    • Drag the goal in the cluster to the right or left sides to achieve the hierarchical structure <br/>"
              id="t-1"
            >
              *
            </Tooltips>
          </Nav.Link>
        </Nav.Item>
        <Nav.Item>
          <Nav.Link onClick={graphClick}>
            Render Model
            <Tooltips
              id="t-2"
              title="• Click <strong><code>Edit All</code></strong> on the left section to edit the names of goals <br/>
                    • Click <strong><code>Drag All</code></strong> on the left section to drag the cluster into the graph on the right section<br/>
                    • Click <strong><code>Render</code></strong> on the left section to generate the goal modal<br/>"
            >
              *
            </Tooltips>
          </Nav.Link>
        </Nav.Item>
      </Nav>
    </div>
  );
};

export default ProgressBar;
