"""add functional status

Revision ID: 62f87f0ea9ca
Revises: 53fe63ff107b
Create Date: 2026-04-15 13:00:02.179553

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = '62f87f0ea9ca'
down_revision: Union[str, Sequence[str], None] = '53fe63ff107b'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


functional_status_enum = sa.Enum(
    'functional',
    'lost',
    'broken',
    name='functional_status_enum'
)


def upgrade() -> None:
    bind = op.get_bind()

    functional_status_enum.create(bind, checkfirst=True)

    op.add_column(
        'equipment',
        sa.Column(
            'functional_status',
            functional_status_enum,
            nullable=False,
            server_default='functional',
        ),
    )

    op.add_column(
        'equipment',
        sa.Column('functional_status_comment', sa.Text(), nullable=True),
    )

    op.alter_column('equipment', 'functional_status', server_default=None)


def downgrade() -> None:
    bind = op.get_bind()

    op.drop_column('equipment', 'functional_status_comment')
    op.drop_column('equipment', 'functional_status')
    functional_status_enum.drop(bind, checkfirst=True)