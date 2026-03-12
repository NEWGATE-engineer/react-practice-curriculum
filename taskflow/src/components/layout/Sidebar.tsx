import { NavLink } from "react-router-dom";

const navItems = [
  {label: 'ダッシュボード', to: '/'},
  {label: 'タスク', to: '/tasks'},
  {label: 'プロジェクト', to: '/projects'},
];

export function Sidebar() {
  return (
    <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4">
      <nav>
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.to}>
              {/* NavLinkは現在のURLとマッチする場合にアクティブスタイルを適用 */}
              <NavLink
                to={item.to}
                end={item.to === '/'}
                className={({ isActive }) =>
                  `block px-3 py-2 rounded-md text-sm transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-700 hover:bg-gray-200'
                  }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};



// chapter01
// // 型定義。最後にある[]でitemsの中のオブジェクトの配列という意味
// type SidebarProps = {
//   items: {
//     label: string;
//     href: string;
//   }[];
// };

// export function Sidebar({ items }: SidebarProps) {
//   return (
//     <aside className="w-64 bg-gray-50 border-r border-gray-200 p-4">
//       <nav>
//         <ul className="space-y-1">
//           {items.map((item) => (
//             <li key={item.href}>
//               <a
//                 href={item.href}
//                 className="block px-3 py-2 rounded-md text-sm text-gray-700 hover:bg-gray-200"
//               >
//                 {item.label}
//               </a>
//             </li>
//           ))}
//         </ul>
//       </nav>
//     </aside>
//   );
// }